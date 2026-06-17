import "dotenv/config";
import { CooperativeService } from '../modules/cooperative/services/cooperative.service';
import { LoanService } from '../modules/loan/services/loan.service';
import { WebhookController } from '../modules/transaction/controllers/webhook.controller';
import { prisma } from '@/prisma';
import { requestContextStore } from '../utils/contextStore';
import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';

async function runTest() {
  console.log('=== STARTING PHASE 4 DIRECT DEBITS & WHITE-LABEL STATEMENT NARRATIONS TEST ===');

  const coopService = new CooperativeService();
  const loanService = new LoanService();
  const webhookController = new WebhookController();

  const randomPrefix = Math.random().toString(36).substring(2, 6);
  const testSubdomain = `${randomPrefix}-coop-${Date.now()}`;
  const mockCacNumber = `CAC-${Math.floor(100000 + Math.random() * 900000)}`;

  let createdCoopId = '';
  let createdMemberBiodataId = '';
  let createdMemberUserId = '';
  let createdLoanTypeId = '';
  let createdLoanId = '';

  try {
    // 1. Register Cooperative
    console.log('\n--- 1. Registering Cooperative ---');
    const registerResult = await coopService.registerCooperative({
      name: 'Pinnacle Thrift Coop',
      registration_number: mockCacNumber,
      cacNumber: mockCacNumber,
      country: 'Nigeria',
      currency: 'NGN',
      admin_user: {
        name: 'Jane Pinnacle',
        email: `jane@${testSubdomain}.com`,
        password: 'Password123!'
      },
      subdomain: testSubdomain,
      settlementBankCode: '035',
      settlementAccountNumber: '0123456789',
      splitPercent: 2.00
    });

    createdCoopId = registerResult.data.cooperative_id;
    console.log(`✅ Cooperative registered: "${registerResult.data.name}" (ID: ${createdCoopId})`);

    // 2. Set up Member with AccountInfo and active Savings
    console.log('\n--- 2. Setting up Member, Bank Account and Savings ---');
    const bank = await prisma.bank.findFirst() || await prisma.bank.create({
      data: { name: 'Wema Bank', code: '035', status: true }
    });

    const memberBiodata = await prisma.biodata.create({
      data: {
        erpId: `${randomPrefix}-ERP-002`,
        ippisId: `${randomPrefix}-IPPIS-002`,
        firstName: 'Damilola',
        lastName: 'Aina',
        fullName: 'Damilola Aina',
        staffNo: `${randomPrefix}-STF-002`,
        dateOfEmployment: new Date(),
        department: 'Finance',
        residentialAddress: '99 Pinnacle Crescent, Abuja',
        emailAddress: `damilola@${testSubdomain}.com`,
        phoneNumber: '080' + Math.floor(10000000 + Math.random() * 90000000),
        nextOfKin: 'Tobi Aina',
        relationshipOfNextOfKin: 'Brother',
        nextOfKinPhoneNumber: '08098765432',
        nextOfKinEmailAddress: 'tobi@gmail.com',
        cooperativeId: createdCoopId,
        accountInfo: {
          create: {
            bankId: bank.id,
            accountNumber: '2233445566',
            bvn: '22222222222',
            accountName: 'Damilola Aina',
            isVerified: true,
            verificationDate: new Date()
          }
        }
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

    // Initialize active savings
    await prisma.savings.create({
      data: {
        memberId: memberBiodata.id,
        erpId: memberBiodata.erpId,
        balance: new Decimal(200000.00), // High balance for 3x loan check
        monthlyTarget: new Decimal(5000.00),
        totalGrossAmount: new Decimal(200000.00),
        totalSavingsAmount: new Decimal(200000.00),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        cooperativeId: createdCoopId,
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Member initialized: "${memberBiodata.fullName}"`);

    // 3. Create a Loan Type and Apply/Approve/Disburse Loan
    console.log('\n--- 3. Applying, Approving & Disbursing Loan ---');
    const loanType = await prisma.loanType.create({
      data: {
        name: 'Pinnacle Regular Loan',
        description: 'Standard 12-month loan',
        interestRate: new Decimal(0.10),
        minDuration: 1,
        maxDuration: 12,
        maxLoanAmount: new Decimal(500000.00),
        savingsMultiplier: new Decimal(3.00),
        cooperativeId: createdCoopId
      }
    });
    createdLoanTypeId = loanType.id;

    // Apply for loan in cooperative context
    let loan = await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      return await loanService.applyForLoan({
        loanTypeId: loanType.id,
        loanAmount: 100000.00,
        loanTenure: 6,
        loanPurpose: 'Emergency repairs',
        biodataId: memberBiodata.id,
        erpId: memberBiodata.erpId,
        userId: memberUser.id,
        loanTypeName: loanType.name,
        loanTypeDescription: loanType.description,
        loanTypeInterestRate: 0.10
      });
    });
    createdLoanId = loan.id;
    console.log(`✅ Applied for Loan ID: ${createdLoanId}`);

    // Update steps to status: DISBURSED (must transit PENDING -> IN_REVIEW -> REVIEWED -> APPROVED -> DISBURSED)
    loan = await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      // PENDING -> IN_REVIEW
      await loanService.updateLoanStatus(loan.id, 'IN_REVIEW', 'Reviewed application', memberUser.id);
      // IN_REVIEW -> REVIEWED
      await loanService.updateLoanStatus(loan.id, 'REVIEWED', 'Pre-approved', memberUser.id);
      // REVIEWED -> APPROVED
      await loanService.updateLoanStatus(loan.id, 'APPROVED', 'Approved by chairman', memberUser.id);
      // APPROVED -> DISBURSED (Generates Transaction & Statement Narration)
      return await loanService.updateLoanStatus(loan.id, 'DISBURSED', 'Disbursed funds', memberUser.id);
    });

    console.log(`✅ Loan transitioned to DISBURSED`);

    // 4. Verify Dynamic White-Label Statement Narration in Disbursement Transaction Metadata
    console.log('\n--- 4. Verifying White-Label Payout Statement Narration ---');
    const disbursementTx = await prisma.transaction.findFirst({
      where: {
        loanId: loan.id,
        transactionType: 'LOAN_DISBURSEMENT'
      }
    });

    if (!disbursementTx) {
      throw new Error('Disbursement transaction record was not created');
    }

    const narration = (disbursementTx.metadata as any)?.narration;
    console.log(`Expected Narration prefix: "LOAN - PINNACLE THRIFT COOP DISB-"`);
    console.log(`Actual Narration:           "${narration}"`);

    if (narration && narration.startsWith('LOAN - PINNACLE THRIFT COOP DISB-')) {
      console.log('✅ Statement narration matches the white-label cooperative clean name pattern!');
    } else {
      throw new Error(`Invalid statement narration in metadata: ${narration}`);
    }

    // 5. Initiate Mono Direct Debit Mandate
    console.log('\n--- 5. Initiating Mono Direct Debit Mandate ---');
    const mandate = await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      return await loanService.initiateLoanMandate(loan.id, 50000.00, 'selfie_verification');
    });

    console.log('✅ Mandate Record:', JSON.stringify(mandate, null, 2));
    if (mandate && mandate.status === 'PENDING' && mandate.monoUrl && mandate.reference.startsWith('MD_LOAN_')) {
      console.log('✅ Mandate successfully created with PENDING status and Mono Connect Widget URL.');
    } else {
      throw new Error('Mandate creation failed or returned invalid properties.');
    }

    // 6. Verify and Sync Mandate Status with Mono (triggers mock update to ACTIVE)
    console.log('\n--- 6. Syncing Mandate Status ---');
    const activeMandate = await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      return await loanService.getLoanMandate(loan.id);
    });

    console.log(`Mandate Status After Sync: ${activeMandate.status}`);
    if (activeMandate.status === 'ACTIVE') {
      console.log('✅ Mandate successfully transitioned to ACTIVE status.');
    } else {
      throw new Error(`Expected mandate status ACTIVE, got: ${activeMandate.status}`);
    }

    // 7. Trigger a Direct Debit Sweep
    console.log('\n--- 7. Triggering Direct Debit Sweep for Repayment ---');
    const sweepResult = await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      return await loanService.triggerLoanRepaymentSweep(loan.id, 15000.00);
    });

    console.log('Sweep result:', JSON.stringify(sweepResult, null, 2));
    const sweepRef = sweepResult.reference;

    // Verify a PENDING LOAN_REPAYMENT transaction exists with metadata.sweepReference
    const pendingRepaymentTx = await prisma.transaction.findFirst({
      where: {
        loanId: loan.id,
        transactionType: 'LOAN_REPAYMENT',
        status: 'PENDING'
      }
    });

    if (pendingRepaymentTx && (pendingRepaymentTx.metadata as any).sweepReference === sweepRef) {
      console.log(`✅ Pending repayment transaction successfully created with sweepRef: ${sweepRef}`);
    } else {
      throw new Error('Pending repayment transaction was not registered correctly.');
    }

    // 8. Simulate Successful Direct Debit Payment Webhook from Mono
    console.log('\n--- 8. Simulating Successful Webhook from Mono ---');
    const webhookPayload = {
      event: 'direct_debit.payment_successful',
      data: {
        reference: sweepRef,
        amount: 1500000 // 15,000 NGN in kobo
      }
    };

    const mockReq = {
      headers: {
        'mono-webhook-secret': 'mock-mono-secret'
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
    process.env.MONO_WEBHOOK_SEC = 'mock-mono-secret';
    await webhookController.handleWebhook(mockReq, mockRes, mockNext);

    console.log(`✅ Webhook response status: ${responseStatus}`);
    console.log('✅ Webhook response body:', JSON.stringify(responseData, null, 2));

    if (responseStatus !== 200 || responseData.status !== 'success') {
      throw new Error(`Webhook handler failed to process successful sweep.`);
    }

    // 9. Verify Loan and Schedule updates after Webhook clears payment
    console.log('\n--- 9. Checking Loan schedule and Balance updates after Webhook ---');
    const finalLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: { repayments: true, paymentSchedules: true }
    });

    console.log(`Loan Paid Amount:       ${finalLoan?.paidAmount.toString()} NGN`);
    console.log(`Loan Remaining Balance: ${finalLoan?.remainingBalance.toString()} NGN`);
    console.log(`Repayment count:        ${finalLoan?.repayments.length}`);

    if (finalLoan && Number(finalLoan.paidAmount) === 15000) {
      console.log('✅ Webhook completed the sweep: Loan paid amount updated successfully.');
    } else {
      throw new Error(`Repayment not cleared correctly. Paid amount is ${finalLoan?.paidAmount}`);
    }

    // Verify the transaction was updated to COMPLETED
    const clearedTx = await prisma.transaction.findUnique({
      where: { id: pendingRepaymentTx.id }
    });

    if (clearedTx && clearedTx.status === 'COMPLETED') {
      console.log('✅ Repayment transaction status updated from PENDING to COMPLETED.');
    } else {
      throw new Error(`Expected transaction status COMPLETED, got: ${clearedTx?.status}`);
    }

    // Cleanup
    console.log('\n--- 10. Cleaning up test records ---');
    await prisma.directDebitMandate.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.transaction.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.loanSchedule.deleteMany({ where: { loanId: loan.id } });
    await prisma.loanRepayment.deleteMany({ where: { loanId: loan.id } });
    await prisma.loanStatusHistory.deleteMany({ where: { loanId: loan.id } });
    await prisma.loan.delete({ where: { id: loan.id } });
    await prisma.loanType.delete({ where: { id: createdLoanTypeId } });
    await prisma.savings.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.requestApproval.deleteMany({ where: { request: { cooperativeId: createdCoopId } } });
    await prisma.request.deleteMany({ where: { cooperativeId: createdCoopId } });
    await prisma.notification.deleteMany({ where: { user: { cooperativeId: createdCoopId } } });
    await prisma.user.delete({ where: { id: createdMemberUserId } });
    await prisma.accountInfo.deleteMany({ where: { biodataId: memberBiodata.id } });
    await prisma.biodata.delete({ where: { id: createdMemberBiodataId } });

    await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      await prisma.userRole.deleteMany();
      await prisma.adminUserProfile.deleteMany();
      await prisma.user.deleteMany();
    });

    await prisma.cooperative.delete({ where: { id: createdCoopId } });
    console.log('✅ Cleanup completed.');

    console.log('\n🎉 ALL PHASE 4 INTEGRATION FLOW TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Attempt cleanup
    try {
      if (createdCoopId) {
        await prisma.directDebitMandate.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        await prisma.transaction.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        if (createdLoanId) {
          await prisma.loanSchedule.deleteMany({ where: { loanId: createdLoanId } }).catch(()=>{});
          await prisma.loanRepayment.deleteMany({ where: { loanId: createdLoanId } }).catch(()=>{});
          await prisma.loanStatusHistory.deleteMany({ where: { loanId: createdLoanId } }).catch(()=>{});
          await prisma.loan.delete({ where: { id: createdLoanId } }).catch(()=>{});
        }
        if (createdLoanTypeId) await prisma.loanType.delete({ where: { id: createdLoanTypeId } }).catch(()=>{});
        await prisma.savings.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        await prisma.requestApproval.deleteMany({ where: { request: { cooperativeId: createdCoopId } } }).catch(()=>{});
        await prisma.request.deleteMany({ where: { cooperativeId: createdCoopId } }).catch(()=>{});
        await prisma.notification.deleteMany({ where: { user: { cooperativeId: createdCoopId } } }).catch(()=>{});
        if (createdMemberUserId) await prisma.user.delete({ where: { id: createdMemberUserId } }).catch(()=>{});
        if (createdMemberBiodataId) {
          await prisma.accountInfo.deleteMany({ where: { biodataId: createdMemberBiodataId } }).catch(()=>{});
          await prisma.biodata.delete({ where: { id: createdMemberBiodataId } }).catch(()=>{});
        }
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
