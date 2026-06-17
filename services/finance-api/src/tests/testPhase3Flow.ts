import "dotenv/config";
import { CooperativeService } from '../modules/cooperative/services/cooperative.service';
import { WebhookController } from '../modules/transaction/controllers/webhook.controller';
import { prisma } from '@/prisma';
import { requestContextStore } from '../utils/contextStore';
import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';

async function runTest() {
  console.log('=== STARTING PHASE 3 BANKING SUB-ACCOUNT & PAYOUT INTEGRATION TEST ===');

  const coopService = new CooperativeService();
  const webhookController = new WebhookController();

  const randomPrefix = Math.random().toString(36).substring(2, 6);
  const testSubdomain = `${randomPrefix}-coop-${Date.now()}`;
  const mockCacNumber = `CAC-${Math.floor(100000 + Math.random() * 900000)}`;

  let createdCoopId = '';
  let createdMemberBiodataId = '';
  let createdMemberUserId = '';

  try {
    // 1. Register Cooperative with CAC and Settlement Bank details (SaaS Fee Split = 2.5%)
    console.log('\n--- 1. Registering Cooperative with CAC and Bank Details ---');
    const registerResult = await coopService.registerCooperative({
      name: 'Alliance Wealth Cooperative',
      registration_number: mockCacNumber,
      cacNumber: mockCacNumber,
      country: 'Nigeria',
      currency: 'NGN',
      admin_user: {
        name: 'John Alliance',
        email: `john@${testSubdomain}.com`,
        password: 'Password123!'
      },
      subdomain: testSubdomain,
      settlementBankCode: '035', // Wema Bank
      settlementAccountNumber: '0123456789',
      splitPercent: 2.50
    });

    console.log('✅ Registration result:', JSON.stringify(registerResult, null, 2));
    createdCoopId = registerResult.data.cooperative_id;
    const subaccountCode = registerResult.data.subaccount_code;

    // Verify database record has the CAC and subaccount details
    const coopRecord = await prisma.cooperative.findUnique({
      where: { id: createdCoopId }
    });

    if (coopRecord && coopRecord.cacNumber === mockCacNumber && coopRecord.subaccountCode === subaccountCode && Number(coopRecord.splitPercent) === 2.5) {
      console.log('✅ Database fields verified: cacNumber, subaccountCode, splitPercent match expected values.');
    } else {
      throw new Error('Database cooperative record does not match expected KYC / sub-account values.');
    }

    // 2. Set up a Mock Member and their Savings plan for Scoping Webhook Payments
    console.log('\n--- 2. Setting up Mock Member & Savings Record ---');
    
    // We create the member biodata and user unscoped
    const memberBiodata = await prisma.biodata.create({
      data: {
        erpId: `${randomPrefix}-ERP-001`,
        ippisId: `${randomPrefix}-IPPIS-001`,
        firstName: 'Tunde',
        lastName: 'Fola',
        fullName: 'Tunde Fola',
        staffNo: `${randomPrefix}-STF-001`,
        dateOfEmployment: new Date(),
        department: 'Operations',
        residentialAddress: '45 Fola Road, Lagos',
        emailAddress: `tunde@${testSubdomain}.com`,
        phoneNumber: '080' + Math.floor(10000000 + Math.random() * 90000000),
        nextOfKin: 'Sola Fola',
        relationshipOfNextOfKin: 'Spouse',
        nextOfKinPhoneNumber: '08012345678',
        nextOfKinEmailAddress: 'sola@gmail.com',
        cooperativeId: createdCoopId,
      }
    });
    createdMemberBiodataId = memberBiodata.id;

    const memberUser = await prisma.user.create({
      data: {
        username: memberBiodata.emailAddress,
        password: 'hashed-password',
        isActive: true,
        isMember: true,
        cooperativeId: createdCoopId,
        biodataId: memberBiodata.id
      }
    });
    createdMemberUserId = memberUser.id;

    // Create a savings record for this member
    const memberSavings = await prisma.savings.create({
      data: {
        memberId: memberBiodata.id,
        erpId: memberBiodata.erpId,
        balance: new Decimal(1000.00),
        monthlyTarget: new Decimal(2000.00),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        cooperativeId: createdCoopId
      }
    });
    console.log(`✅ Member "${memberBiodata.fullName}" and Savings ID "${memberSavings.id}" initialized successfully.`);

    // 3. Simulate Incoming Webhook Call (Monnify) for deposit credit
    console.log('\n--- 3. Simulating Incoming Webhook from Monnify ---');
    
    // Construct fake Monnify Successful Transaction Webhook body
    const webhookPayload = {
      eventType: 'SUCCESSFUL_TRANSACTION',
      eventData: {
        transactionReference: `TXN-${randomPrefix}-999`,
        paymentReference: `PAY-${randomPrefix}-999`,
        amountPaid: 10000.00,
        settlementAmount: 9750.00,
        customer: {
          email: memberBiodata.emailAddress
        },
        destinationAccountPaymentInformation: {
          subAccountCode: subaccountCode
        },
        metaData: {
          cooperativeId: createdCoopId,
          memberId: memberBiodata.id,
          savingsId: memberSavings.id,
          transactionType: 'SAVINGS_DEPOSIT'
        }
      }
    };

    // Construct mock express Request and Response
    const mockReq = {
      headers: {
        'monnify-signature': 'mock-sig'
      },
      body: webhookPayload
    } as unknown as Request;

    let responseData: any = null;
    let responseStatus = 0;
    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        return this;
      }
    } as unknown as Response;

    const mockNext = (err?: any) => {
      if (err) throw err;
    };

    // Run the webhook handler
    // We bypass signature check for tests using environment variable setting
    process.env.BYPASS_WEBHOOK_SIGNATURE_FOR_TESTING = 'true';
    await webhookController.handleWebhook(mockReq, mockRes, mockNext);

    console.log(`✅ Webhook response status: ${responseStatus}`);
    console.log('✅ Webhook response body:', JSON.stringify(responseData, null, 2));

    if (responseStatus !== 200 || responseData.status !== 'success') {
      throw new Error(`Webhook handler failed with status ${responseStatus}`);
    }

    // 4. Assert Transaction Split and Savings Balance Updates
    console.log('\n--- 4. Asserting Split and Database Account Balance Updates ---');
    
    // Read savings record scoped to check the new balance
    const updatedSavings = await prisma.savings.findUnique({
      where: { id: memberSavings.id }
    });

    console.log(`Savings Balance Before: 1000.00 NGN`);
    console.log(`Savings Balance After:  ${updatedSavings?.balance.toString()} NGN`);

    // Expected savings credit is full amount = 10000 NGN. New balance should be 11000.00 NGN
    if (updatedSavings && Number(updatedSavings.balance) === 11000) {
      console.log('✅ Member savings account successfully credited with full deposit amount (10,000 NGN).');
    } else {
      throw new Error(`Invalid savings balance. Expected 11000.00, got ${updatedSavings?.balance}`);
    }

    // Verify transactions are recorded
    const transactions = await prisma.transaction.findMany({
      where: { cooperativeId: createdCoopId }
    });

    console.log(`Transactions recorded: ${transactions.length}`);
    for (const tx of transactions) {
      console.log(`- Tx [${tx.transactionType}] Amount: ${tx.amount.toString()} NGN | Description: "${tx.description}"`);
    }

    // Should find at least a SAVINGS_DEPOSIT transaction of 10000.00 and a FEE transaction of 250.00
    const depositTx = transactions.find(t => t.transactionType === 'SAVINGS_DEPOSIT');
    const feeTx = transactions.find(t => t.transactionType === 'FEE');

    if (depositTx && Number(depositTx.amount) === 10000) {
      console.log('✅ SAVINGS_DEPOSIT transaction of 10,000 NGN verified.');
    } else {
      throw new Error('SAVINGS_DEPOSIT transaction missing or incorrect.');
    }

    if (feeTx && Number(feeTx.amount) === 250) {
      console.log('✅ FEE (SaaS Fee Split) transaction of 250 NGN verified.');
      if (feeTx.parentTxnId === depositTx.id) {
        console.log('✅ FEE transaction properly linked to parent SAVINGS_DEPOSIT transaction.');
      } else {
        throw new Error('FEE transaction parentTxnId mapping failed.');
      }
    } else {
      throw new Error('FEE (SaaS Fee Split) transaction missing or incorrect.');
    }

    // 5. Cleanup test records
    console.log('\n--- 5. Cleaning up test records ---');
    await prisma.transaction.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.savings.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.user.delete({ where: { id: createdMemberUserId } });
    await prisma.biodata.delete({ where: { id: createdMemberBiodataId } });

    // Clean cooperative staff/admin records
    await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      await prisma.userRole.deleteMany();
      await prisma.adminUserProfile.deleteMany();
      await prisma.user.deleteMany();
    });

    await prisma.cooperative.delete({ where: { id: createdCoopId } });
    console.log('✅ Cleanup completed.');

    console.log('\n🎉 ALL PHASE 3 INTEGRATION FLOW TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Attempt cleanup if IDs are set
    try {
      if (createdCoopId) {
        await prisma.transaction.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        await prisma.savings.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        if (createdMemberUserId) await prisma.user.delete({ where: { id: createdMemberUserId } }).catch(()=>{});
        if (createdMemberBiodataId) await prisma.biodata.delete({ where: { id: createdMemberBiodataId } }).catch(()=>{});
        await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
          await prisma.userRole.deleteMany().catch(()=>{});
          await prisma.adminUserProfile.deleteMany().catch(()=>{});
          await prisma.user.deleteMany().catch(()=>{});
        }).catch(()=>{});
        await prisma.cooperative.delete({ where: { id: createdCoopId } }).catch(()=>{});
      }
    } catch (_) {}
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
