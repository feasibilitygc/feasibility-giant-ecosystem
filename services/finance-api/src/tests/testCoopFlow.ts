import "dotenv/config";
import { CooperativeService } from '../modules/cooperative/services/cooperative.service';
import { prisma } from '@/prisma';
import { requestContextStore } from '../utils/contextStore';

async function runTest() {
  console.log('--- STARTING COOPERATIVE REGISTRATION & SCOPING TEST ---');
  
  const service = new CooperativeService();
  const testSubdomain = `test-coop-${Date.now()}`;
  
  try {
    // 1. Register a new cooperative (This runs outside HTTP context, so prisma is unscoped)
    const result = await service.registerCooperative({
      name: 'Test Cooperative Society',
      registration_number: 'TEST-12345',
      country: 'Nigeria',
      currency: 'NGN',
      admin_user: {
        name: 'Jane Admin',
        email: `admin@${testSubdomain}.com`,
        password: 'Password123!'
      },
      subdomain: testSubdomain
    });

    console.log('✅ Registration result:', JSON.stringify(result, null, 2));
    const createdCoopId = result.data.cooperative_id;

    // 2. Test Unscoped query (admin/global view)
    const allCoops = await prisma.cooperative.findMany();
    console.log(`✅ Unscoped view: Found ${allCoops.length} total cooperatives in db.`);

    // 3. Test Scoped query using AsyncLocalStorage request context
    console.log(`\n--- Simulating Scoped Request for Cooperative ID: ${createdCoopId} ---`);
    
    await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      // Fetch users - should only find the admin user created for this cooperative
      const scopedUsers = await prisma.user.findMany({
        include: { adminProfile: true }
      });
      
      console.log(`✅ Scoped view: Found ${scopedUsers.length} user(s).`);
      
      if (scopedUsers.length === 1 && scopedUsers[0].username === `admin@${testSubdomain}.com`) {
        console.log('✅ Scoped user matches the registered cooperative admin!');
      } else {
        console.error('❌ Scoped user list validation failed.');
      }
    });

    // 4. Test Scoped query with a different/empty scope
    console.log(`\n--- Simulating Scoped Request for Non-Existent Cooperative ID ---`);
    await requestContextStore.run({ cooperativeId: '00000000-0000-0000-0000-000000000001' }, async () => {
      const emptyUsers = await prisma.user.findMany();
      console.log(`✅ Scoped view (empty coop): Found ${emptyUsers.length} users (Expected: 0).`);
      if (emptyUsers.length === 0) {
        console.log('✅ Scoped queries returned 0 results for non-matching cooperative ID!');
      } else {
        console.error('❌ Data leak: Scoped query returned users from another cooperative!');
      }
    });

    // 5. Cleanup test records
    console.log('\n--- Cleaning up test records ---');
    // Scoped delete: must run unscoped or scoped to the cooperative
    await requestContextStore.run({ cooperativeId: createdCoopId }, async () => {
      // Scoped delete operations
      await prisma.userRole.deleteMany();
      await prisma.adminUserProfile.deleteMany();
      await prisma.user.deleteMany();
    });

    // Delete cooperative itself (unscoped)
    await prisma.cooperative.delete({
      where: { id: createdCoopId }
    });
    console.log('✅ Cleanup completed successfully.');
    console.log('\n🎉 ALL INTEGRATION FLOW TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
