import * as bankSeeder from './bankSeed';
import * as loanTypeSeeder from './loanTypeSeed';
import * as roleSeeder from './roleSeed';
import * as personalSavingsPlanSeeder from './personalSavingsPlanSeed';
import { prisma } from '@/prisma';

async function main() {
  try {
    console.log('Starting database seeding...');

    // Step 1: Seed Banks
    console.log('\n🏦 Seeding banks...');
    await bankSeeder.main();

    // Step 2: Seed Loan Types
    console.log('\n💰 Seeding loan types...');
    await loanTypeSeeder.main();    
    
    // Step 3: Seed Roles and Admin
    console.log('\n👥 Seeding roles and admin...');
    await roleSeeder.main();
    
    // Step 4: Seed Personal Savings Plan Types
    console.log('\n💰 Seeding personal savings plan types...');
    await personalSavingsPlanSeeder.main();

    console.log('\n✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  });