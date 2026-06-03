import { SMS_ROUTES } from '../interfaces/smsExperience.interface';
import { sendVerificationCode, checkVerificationCode, sendTextMessage } from '../utils/SMSUtil';

async function testOTPFlow() {
  const testPhone = '07061539439'; // Use your test number
  
  try {
    // Send OTP
    const result = await sendVerificationCode('2347061539439');
    const sendResult = await sendVerificationCode(testPhone);
    console.log('✅ OTP sent:', sendResult);
    console.log('✅ Message sentL', result)
    
    // Check OTP (you'll need to enter the received OTP)
    const otp = '123456'; // Replace with actual received OTP
    const verifyResult = await checkVerificationCode(testPhone, otp);
    console.log('✅ OTP verified:', verifyResult);
  } catch (error) {
    console.error('❌ OTP test failed:', error);
  }
}

