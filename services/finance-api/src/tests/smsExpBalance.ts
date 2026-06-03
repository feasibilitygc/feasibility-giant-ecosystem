import { checkSMSBalance } from '../utils/SMSUtil';

async function testBalance() {
  try {
    const balance = await checkSMSBalance();
    console.log('✅ Balance check successful:', balance);
  } catch (error) {
    console.error('❌ Balance check failed:', error);
  }
}