import { sendVerificationCode, checkVerificationCode, sendTextMessage, checkSMSBalance } from '../utils/SMSUtil';

async function testSMSFunctions() {
  console.log('🚀 Starting SMS Experience tests...\n');

  // Test 1: Check balance
  console.log('1. Testing balance check...');
  try {
    const balance = await checkSMSBalance();
    console.log('✅ Balance check successful:', balance);
  } catch (error) {
    console.error('❌ Balance check failed:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Send a simple text message
  console.log('2. Testing direct SMS sending...');
  try {
    const testMessage = 'Hello from SMS Experience API test!';
    const smsResult = await sendTextMessage('07061539439', testMessage, {
      route: 'fallback',
      priority: 'normal'
    });
    console.log('✅ Direct SMS sent successfully:', smsResult);
  } catch (error) {
    console.error('❌ Direct SMS failed:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Send verification code
  console.log('3. Testing OTP verification flow...');
  const testPhone = '07061539439';
  
  try {
    // Send OTP
    console.log(`📱 Sending OTP to ${testPhone}...`);
    const otpResult = await sendVerificationCode(testPhone);
    console.log('✅ OTP sent successfully:', otpResult);
    
    // Wait for user input (in real scenario, user would receive SMS)
    console.log('\n📩 SMS should be delivered to the phone number.');
    console.log('💡 In a real test, you would enter the received OTP here.');
    
    // For testing purposes, we'll simulate with a dummy OTP
    // In real usage, you'd get the OTP from user input
    console.log('\n⚠️  Note: To complete the test, you would need to:');
    console.log('   1. Check the phone for the received OTP');
    console.log('   2. Call checkVerificationCode with the actual OTP');
    console.log('   3. Example: checkVerificationCode("07061539439", "123456")');
    
  } catch (error) {
    console.error('❌ OTP test failed:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 Test completed! Check the logs above for results.');
  
  // Gracefully exit
  process.exit(0);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
testSMSFunctions().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});