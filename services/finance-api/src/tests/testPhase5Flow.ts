import "dotenv/config";
import { prisma } from '@/prisma';
import { SettingsController } from '../modules/system/controllers/settings.controller';
import { SystemController } from '../modules/system/controllers/system.controller';
import { SystemSettingsService } from '../modules/system/services/systemSettings.service';
import { requestContextStore } from '../utils/contextStore';
import { Request, Response } from 'express';
import { Decimal } from 'decimal.js';

// Simple Express Request/Response Mock helpers
function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = function (code: number) {
    this.statusCode = code;
    return this as Response;
  };
  res.json = function (data: any) {
    this.data = data;
    return this as Response;
  };
  return res as Response;
}

async function runTest() {
  console.log('=== STARTING PHASE 5 SUPER ADMIN CONFIGURATIONS & ANALYTICS TEST ===');

  const settingsController = new SettingsController();
  const systemController = new SystemController();
  const settingsService = SystemSettingsService.getInstance();

  // Create mock user with SUPER_ADMIN role for the requests
  console.log('\n--- 1. Setting up mock SUPER_ADMIN user ---');
  let superAdminUser = await prisma.user.findFirst({
    where: { username: 'superadmin_test' }
  });

  if (!superAdminUser) {
    let superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Super Administrator',
          permissions: ['SYSTEM_OPERATIONS', 'VIEW_SHARES_CONFIG', 'MANAGE_SHARE_AMOUNT'],
          approvalLevel: 3,
          canApprove: true,
          moduleAccess: ['SYSTEM', 'ADMIN']
        }
      });
    }

    superAdminUser = await prisma.user.create({
      data: {
        username: 'superadmin_test',
        isActive: true,
        isMember: false,
        password: 'Password123!',
        roleAssignments: {
          create: {
            roleId: superAdminRole.id
          }
        }
      }
    });
  }
  console.log(`✅ Super Admin test user verified/created (ID: ${superAdminUser.id})`);

  try {
    // 2. Initialize default system settings
    console.log('\n--- 2. Initializing default settings in DB ---');
    await settingsService.initializeDefaultSettings();

    // Verify key defaults exist in DB
    const generalSettingRecord = await prisma.systemSettings.findUnique({
      where: { key: 'GENERAL_SETTINGS' }
    });
    if (!generalSettingRecord) {
      throw new Error('GENERAL_SETTINGS not found in database');
    }
    console.log('✅ Default settings correctly stored in the database');

    // 3. Get all settings using controller
    console.log('\n--- 3. Testing SettingsController.getAllSettings ---');
    const reqGet = {
      user: {
        id: superAdminUser.id,
        roles: [{ name: 'SUPER_ADMIN', isAdmin: true }],
        permissions: ['SYSTEM_OPERATIONS'],
        approvalLevel: 3
      }
    } as any;

    const resGet = mockResponse();
    await settingsController.getAllSettings(reqGet, resGet, (err) => {
      if (err) throw err;
    });

    const bodyGet = (resGet as any).data;
    if (resGet.statusCode !== 200 || !bodyGet.success) {
      throw new Error(`Failed to retrieve settings, response: ${JSON.stringify(bodyGet)}`);
    }

    console.log('✅ Settings retrieved successfully:');
    console.log(`   - Org Name: ${bodyGet.data.general?.organizationName}`);
    console.log(`   - MFA Enabled: ${bodyGet.data.security?.mfaEnabled}`);
    console.log(`   - SMS Notifications Enabled: ${bodyGet.data.notifications?.enableSmsNotifications}`);
    console.log(`   - Maintenance Mode: ${bodyGet.data.advanced?.maintenanceMode}`);

    // 4. Update System settings
    console.log('\n--- 4. Testing SettingsController.updateSystemSettings (General) ---');
    const newGeneralData = {
      ...bodyGet.data.general,
      organizationName: 'Modified Pinnacle Thrift Coop Platform',
      contactEmail: 'modified@coopbank.com'
    };

    const reqUpdate = {
      user: {
        id: superAdminUser.id,
        roles: [{ name: 'SUPER_ADMIN', isAdmin: true }],
        permissions: ['SYSTEM_OPERATIONS'],
        approvalLevel: 3
      },
      body: newGeneralData
    } as any;

    const resUpdate = mockResponse();
    await settingsController.updateSystemSettings(reqUpdate, resUpdate, (err) => {
      if (err) throw err;
    });

    const bodyUpdate = (resUpdate as any).data;
    if (resUpdate.statusCode !== 200 || !bodyUpdate.success) {
      throw new Error(`Failed to update system settings, response: ${JSON.stringify(bodyUpdate)}`);
    }

    console.log(`✅ General settings updated. New Org Name: "${bodyUpdate.data.organizationName}"`);

    // Verify it changed in database
    const generalUpdatedRecord = await prisma.systemSettings.findUnique({
      where: { key: 'GENERAL_SETTINGS' }
    });
    const parsedGeneral = JSON.parse(generalUpdatedRecord!.value);
    if (parsedGeneral.organizationName !== 'Modified Pinnacle Thrift Coop Platform') {
      throw new Error('Updated settings were not successfully persisted in DB');
    }
    console.log('✅ Persistent storage verified in database');

    // 5. Test settings history audit logs
    console.log('\n--- 5. Verifying Settings History Audit Trail ---');
    const historyCount = await prisma.systemSettingsHistory.count({
      where: {
        setting: {
          key: 'GENERAL_SETTINGS'
        }
      }
    });
    if (historyCount === 0) {
      throw new Error('Audit trail record was not generated in systemSettingsHistory');
    }
    console.log(`✅ SystemSettingsHistory tracked successfully. Found ${historyCount} historical logs.`);

    // 6. Test Super Admin Analytics dashboard endpoint
    console.log('\n--- 6. Testing SystemController.getAnalytics ---');
    const reqAnalytics = {
      user: {
        id: superAdminUser.id,
        roles: [{ name: 'SUPER_ADMIN', isAdmin: true }],
        permissions: ['SYSTEM_OPERATIONS'],
        approvalLevel: 3
      }
    } as any;

    const resAnalytics = mockResponse();
    // Wrap req in default cooperative context to simulate tenant routing
    await requestContextStore.run({ cooperativeId: '00000000-0000-0000-0000-000000000000' }, async () => {
      await systemController.getAnalytics(reqAnalytics, resAnalytics, (err) => {
        if (err) throw err;
      });
    });

    const bodyAnalytics = (resAnalytics as any).data;
    if (resAnalytics.statusCode !== 200 || !bodyAnalytics.success) {
      throw new Error(`Failed to retrieve analytics, response: ${JSON.stringify(bodyAnalytics)}`);
    }

    console.log('✅ Analytics dashboard data retrieved successfully:');
    console.log(`   - Cooperatives Count: ${bodyAnalytics.data.overview.cooperativesCount}`);
    console.log(`   - Total Members: ${bodyAnalytics.data.overview.membersCount}`);
    console.log(`   - Active Loans: ${bodyAnalytics.data.overview.activeLoansCount}`);
    console.log(`   - Total Disbursed Loans: ₦${bodyAnalytics.data.overview.totalLoansDisbursed}`);
    console.log(`   - Programmatic SaaS commission earnings: ₦${bodyAnalytics.data.overview.totalSaaSSplitEarnings}`);

    // 7. Test SMS Logs View endpoint
    console.log('\n--- 7. Testing SystemController.getSmsLogs ---');
    // Seed a dummy SMS Log first to guarantee data presence
    await prisma.smsLog.create({
      data: {
        recipient: '2348031234567',
        provider: 'TWILIO',
        messageStatus: 'SENT',
        errorDetails: null,
        cooperativeId: null
      }
    });

    const reqSmsLogs = {
      user: {
        id: superAdminUser.id,
        roles: [{ name: 'SUPER_ADMIN', isAdmin: true }],
        permissions: ['SYSTEM_OPERATIONS'],
        approvalLevel: 3
      },
      query: {
        page: 1,
        limit: 10
      }
    } as any;

    const resSmsLogs = mockResponse();
    await systemController.getSmsLogs(reqSmsLogs, resSmsLogs, (err) => {
      if (err) throw err;
    });

    const bodySmsLogs = (resSmsLogs as any).data;
    if (resSmsLogs.statusCode !== 200 || !bodySmsLogs.success) {
      throw new Error(`Failed to retrieve SMS logs, response: ${JSON.stringify(bodySmsLogs)}`);
    }
    console.log(`✅ SMS logs retrieved successfully. Count: ${bodySmsLogs.data.logs.length}`);
    if (bodySmsLogs.data.logs.length === 0) {
      throw new Error('Seed SMS log was not found in global SMS log retrieval');
    }
    console.log(`   - Recipient: ${bodySmsLogs.data.logs[0].recipient}`);
    console.log(`   - Provider: ${bodySmsLogs.data.logs[0].provider}`);
    console.log(`   - Status: ${bodySmsLogs.data.logs[0].messageStatus}`);

    // 8. Test Payment/Transaction Logs View endpoint
    console.log('\n--- 8. Testing SystemController.getPaymentLogs ---');
    // Ensure we have a transaction seeded
    const dummyCoop = await prisma.cooperative.findFirst();
    if (dummyCoop) {
      await prisma.transaction.create({
        data: {
          transactionType: 'CREDIT',
          baseType: 'CREDIT',
          module: 'SYSTEM',
          amount: new Decimal(5000.00),
          balanceAfter: new Decimal(5000.00),
          status: 'COMPLETED',
          description: 'Dummy platform credit txn',
          initiatedBy: superAdminUser.id,
          cooperativeId: dummyCoop.id
        }
      });
    }

    const reqPaymentLogs = {
      user: {
        id: superAdminUser.id,
        roles: [{ name: 'SUPER_ADMIN', isAdmin: true }],
        permissions: ['SYSTEM_OPERATIONS'],
        approvalLevel: 3
      },
      query: {
        page: 1,
        limit: 5
      }
    } as any;

    const resPaymentLogs = mockResponse();
    await systemController.getPaymentLogs(reqPaymentLogs, resPaymentLogs, (err) => {
      if (err) throw err;
    });

    const bodyPaymentLogs = (resPaymentLogs as any).data;
    if (resPaymentLogs.statusCode !== 200 || !bodyPaymentLogs.success) {
      throw new Error(`Failed to retrieve payment logs, response: ${JSON.stringify(bodyPaymentLogs)}`);
    }
    console.log(`✅ Payment logs retrieved successfully. Count: ${bodyPaymentLogs.data.payments.length}`);
    if (bodyPaymentLogs.data.payments.length > 0) {
      const firstTx = bodyPaymentLogs.data.payments[0];
      console.log(`   - Type: ${firstTx.transactionType}`);
      console.log(`   - Amount: ₦${firstTx.amount}`);
      console.log(`   - SaaS split percentage applied: ${firstTx.splitPercent}%`);
      console.log(`   - SaaS commission amount: ₦${firstTx.saasSplitAmount}`);
    }

    console.log('\n🎉 ALL PHASE 5 SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } finally {
    // 9. Clean up seeded test user and dummy settings
    console.log('\n--- 9. Cleaning up test data ---');
    if (superAdminUser) {
      // Delete logs and setting histories to avoid constraint errors
      await prisma.systemSettingsHistory.deleteMany({
        where: {
          updatedBy: superAdminUser.id
        }
      });
      await prisma.transaction.deleteMany({
        where: {
          initiatedBy: superAdminUser.id
        }
      });
      await prisma.userRole.deleteMany({
        where: {
          userId: superAdminUser.id
        }
      });
      await prisma.user.delete({
        where: {
          id: superAdminUser.id
        }
      });
      console.log('✅ Test user and settings history successfully cleaned up');
    }
  }
}

runTest().catch((error) => {
  console.error('\n❌ PHASE 5 INTEGRATION TEST FAILED ❌');
  console.error(error);
  process.exit(1);
});
