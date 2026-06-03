import axios, { AxiosResponse } from 'axios';
import { ApiError } from './apiError';
import logger from './logger';
import env from '../config/env';
import { 
    SMSResponse, 
    SMSMessageStatus, 
    BalanceResponse,
    OTPRecord
} from '../interfaces/smsExperience.interface'

// SMS Experience API Error Codes
const SMS_ERROR_CODES = {
  'TG00': 'MESSAGE PROCESSED',
  'TG11': 'Invalid Authentication Credentials',
  'TG12': 'Empty Username',
  'TG13': 'Empty Password',
  'TG14': 'Empty Recipients',
  'TG15': 'Empty Message',
  'TG16': 'Empty SenderID',
  'TG17': 'Not Enough Units Balance',
  'TG18': 'Blocked Words Found Sender ID',
  'TG19': 'Blocked Words Found in Message Body',
  'TG20': 'Recipients above the maximum target'
};

// Message Status Codes
const MESSAGE_STATUS_CODES = {
  '0000': { status: 'SENT', description: 'MESSAGE SENT TO PROVIDER' },
  '2222': { status: 'REJECTED', description: 'MESSAGE REJECTED' },
  '0014': { status: 'DND_SENT', description: 'MESSAGE THROUGH COOPERATE DND ROUTE' },
  '3333': { status: 'DND_REJECTED', description: 'DND_REJECTED_NUMBER' }
};

class SMSExperienceService {
  private static instance: SMSExperienceService;
  private otpStorage: Map<string, OTPRecord> = new Map();
  private readonly baseUrl = env.SMS_EXPERIENCE_BASE_URL || 'https://smsexperience.com/api/sms';
  private readonly username: string;
  private readonly password: string;
  private readonly defaultSender: string;
  private readonly otpExpiryMinutes: number;
  private readonly maxOtpAttempts: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Validate required environment variables
    this.username = env.SMS_EXPERIENCE_USERNAME;
    this.password = env.SMS_EXPERIENCE_PASSWORD;
    this.defaultSender = env.SMS_EXPERIENCE_SENDER_ID || 'SMS_EXP';
    this.otpExpiryMinutes = env.OTP_EXPIRY_MINUTES || 5;
    this.maxOtpAttempts = env.MAX_OTP_ATTEMPTS || 3;

    if (!this.username || !this.password) {
      throw new Error('SMS Experience credentials not configured. Check SMS_EXPERIENCE_USERNAME and SMS_EXPERIENCE_PASSWORD environment variables.');
    }

    // Setup periodic cleanup of expired OTPs
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredOTPs();
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    logger.info('SMS Experience Service initialized successfully');
  }

  static getInstance(): SMSExperienceService {
    if (!SMSExperienceService.instance) {
      SMSExperienceService.instance = new SMSExperienceService();
    }
    return SMSExperienceService.instance;
  }

  /**
   * Normalize phone number format
   * Converts +234XXXXXXXXX to 234XXXXXXXXX
   * Converts 0XXXXXXXXX to 234XXXXXXXXX
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/\s+/g, '').trim();
    
    // Remove plus sign if present
    if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }
    
    // Handle Nigerian numbers starting with 0
    if (normalized.startsWith('0') && normalized.length === 11) {
      normalized = '234' + normalized.substring(1);
    }
    
    // Ensure it starts with 234 for Nigerian numbers
    if (!normalized.startsWith('234') && normalized.length === 10) {
      normalized = '234' + normalized;
    }
    
    return normalized;
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired OTPs from memory
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, record] of this.otpStorage.entries()) {
      if (record.expiresAt < now) {
        this.otpStorage.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired OTP records`);
    }
  }

  /**
   * Enhanced SMS Response Parser
   * Handles the actual API response format with 9 pipe-separated values
   */
  private parseSMSResponse(responseText: string): SMSResponse {
    try {
      logger.info('Parsing SMS response:', { responseText });
      
      // Parse the response format: BATCH CODE-BATCH DESCRIPTION:STATUSCODE|Recipient|MessageID|Message status|Status description|...
      const parts = responseText.split(':');
      if (parts.length < 2) {
        throw new Error('Invalid response format - missing colon separator');
      }

      const batchInfo = parts[0].split('-');
      const batchCode = batchInfo[0]?.trim();
      const batchDescription = batchInfo[1]?.trim() || '';

      if (!batchCode) {
        throw new Error('Invalid batch code format');
      }

      const messagesPart = parts[1];
      const messageEntries = messagesPart.split(',');

      const messages: SMSMessageStatus[] = messageEntries.map(entry => {
        const messageParts = entry.split('|');
        
        // Handle both old format (5 parts) and new format (9+ parts)
        if (messageParts.length < 5) {
          throw new Error(`Invalid message entry format - expected at least 5 parts, got ${messageParts.length}`);
        }

        // Extract the first 5 required fields
        const statusCode = messageParts[0]?.trim();
        const recipient = messageParts[1]?.trim();
        const messageId = messageParts[2]?.trim();
        const messageStatus = messageParts[3]?.trim();
        const statusDescription = messageParts[4]?.trim();

        if (!statusCode || !recipient || !messageId || !messageStatus || !statusDescription) {
          throw new Error('Missing required fields in message entry');
        }

        // Map message status to expected enum values
        let normalizedStatus: SMSMessageStatus['messageStatus'];
        switch (messageStatus.toLowerCase()) {
          case 'sent':
            normalizedStatus = 'SENT';
            break;
          case 'rejected':
            normalizedStatus = 'REJECTED';
            break;
          case 'dnd_sent':
            normalizedStatus = 'DND_SENT';
            break;
          case 'dnd_rejected':
            normalizedStatus = 'DND_REJECTED';
            break;
          default:
            normalizedStatus = 'SENT'; // Default fallback
        }

        return {
          statusCode,
          recipient,
          messageId,
          messageStatus: normalizedStatus,
          statusDescription
        };
      });

      const result = {
        batchCode,
        batchDescription,
        messages
      };

      logger.info('SMS response parsed successfully:', result);
      return result;

    } catch (error) {
      logger.error('Failed to parse SMS response', { responseText, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new ApiError('Failed to parse SMS gateway response', 500);
    }
  }

  /**
   * Send SMS through normal route
   */
  private async sendSMSNormal(recipient: string, message: string, sender?: string): Promise<SMSResponse> {
    const normalizedRecipient = this.normalizePhoneNumber(recipient);
    
    try {
      const params = new URLSearchParams({
        username: this.username,
        password: this.password,
        sender: sender || this.defaultSender,
        recipient: normalizedRecipient,
        message: message
      });

      logger.info(`Sending SMS to ${normalizedRecipient} via normal route`);

      const response: AxiosResponse<string> = await axios.get(
        `${this.baseUrl}/sendsms?${params.toString()}`,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.status !== 200) {
        throw new ApiError(`SMS gateway returned status ${response.status}`, response.status);
      }

      const parsedResponse = this.parseSMSResponse(response.data);

      // Check for API errors
      if (parsedResponse.batchCode !== 'TG00') {
        const errorMessage = SMS_ERROR_CODES[parsedResponse.batchCode as keyof typeof SMS_ERROR_CODES] || 'Unknown error';
        throw new ApiError(`SMS sending failed: ${errorMessage}`, 400);
      }

      logger.info(`SMS sent successfully to ${normalizedRecipient}`, { 
        batchCode: parsedResponse.batchCode,
        messageId: parsedResponse.messages[0]?.messageId 
      });

      return parsedResponse;
    } catch (error: any) {
      logger.error('Failed to send SMS via normal route', { recipient: normalizedRecipient, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new ApiError('SMS gateway is unreachable. Please try again later.', 503);
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new ApiError('SMS gateway request timed out. Please try again.', 408);
      }
      
      throw new ApiError('Failed to send SMS. Please try again.', 500);
    }
  }

  /**
   * Send SMS through DND route
   */
  private async sendSMSDND(recipient: string, message: string, sender?: string): Promise<SMSResponse> {
    const normalizedRecipient = this.normalizePhoneNumber(recipient);
    
    try {
      const params = new URLSearchParams({
        username: this.username,
        password: this.password,
        sender: sender || this.defaultSender,
        recipient: normalizedRecipient,
        message: message
      });

      logger.info(`Sending SMS to ${normalizedRecipient} via DND route`);

      const response: AxiosResponse<string> = await axios.get(
        `${this.baseUrl}/dnd-route?${params.toString()}`,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.status !== 200) {
        throw new ApiError(`SMS gateway returned status ${response.status}`, response.status);
      }

      const parsedResponse = this.parseSMSResponse(response.data);

      if (parsedResponse.batchCode !== 'TG00') {
        const errorMessage = SMS_ERROR_CODES[parsedResponse.batchCode as keyof typeof SMS_ERROR_CODES] || 'Unknown error';
        throw new ApiError(`SMS sending failed: ${errorMessage}`, 400);
      }

      logger.info(`SMS sent successfully via DND route to ${normalizedRecipient}`, { 
        batchCode: parsedResponse.batchCode,
        messageId: parsedResponse.messages[0]?.messageId 
      });

      return parsedResponse;
    } catch (error: any) {
      logger.error('Failed to send SMS via DND route', { recipient: normalizedRecipient, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to send SMS via DND route. Please try again.', 500);
    }
  }

  /**
   * Send SMS with DND fallback
   */
  private async sendSMSWithFallback(recipient: string, message: string, sender?: string): Promise<SMSResponse> {
    const normalizedRecipient = this.normalizePhoneNumber(recipient);
    
    try {
      const params = new URLSearchParams({
        username: this.username,
        password: this.password,
        sender: sender || this.defaultSender,
        recipient: normalizedRecipient,
        message: message
      });

      logger.info(`Sending SMS to ${normalizedRecipient} with DND fallback`);

      const response: AxiosResponse<string> = await axios.get(
        `${this.baseUrl}/dnd-fallback?${params.toString()}`,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.status !== 200) {
        throw new ApiError(`SMS gateway returned status ${response.status}`, response.status);
      }

      const parsedResponse = this.parseSMSResponse(response.data);

      if (parsedResponse.batchCode !== 'TG00') {
        const errorMessage = SMS_ERROR_CODES[parsedResponse.batchCode as keyof typeof SMS_ERROR_CODES] || 'Unknown error';
        throw new ApiError(`SMS sending failed: ${errorMessage}`, 400);
      }

      logger.info(`SMS sent successfully with fallback to ${normalizedRecipient}`, { 
        batchCode: parsedResponse.batchCode,
        messageId: parsedResponse.messages[0]?.messageId 
      });

      return parsedResponse;
    } catch (error: any) {
      logger.error('Failed to send SMS with fallback', { recipient: normalizedRecipient, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to send SMS with fallback. Please try again.', 500);
    }
  }

  /**
   * Check account balance
   */
  async checkBalance(): Promise<BalanceResponse> {
    try {
      const params = new URLSearchParams({
        username: this.username,
        password: this.password
      });

      logger.info('Checking SMS account balance');

      const response: AxiosResponse<string> = await axios.get(
        `${this.baseUrl}/balance?${params.toString()}`,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.status !== 200) {
        throw new ApiError(`Balance check failed with status ${response.status}`, response.status);
      }

      // Parse balance response (format may vary, adjust based on actual API response)
      const balanceText = response.data.trim();
      const balance = parseFloat(balanceText) || 0;

      logger.info(`SMS account balance: ${balance}`);

      return {
        balance,
        status: 'success'
      };
    } catch (error: any) {
      logger.error('Failed to check SMS balance', { error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to check SMS balance. Please try again.', 500);
    }
  }

  /**
   * Send a text message (public method)
   */
  async sendTextMessage(
    recipient: string, 
    message: string, 
    options: {
      sender?: string;
      route?: 'normal' | 'dnd' | 'fallback';
      priority?: 'high' | 'normal';
    } = {}
  ): Promise<SMSResponse> {
    const { sender, route = 'fallback', priority = 'normal' } = options;

    // Validate inputs
    if (!recipient || !message) {
      throw new ApiError('Recipient and message are required', 400);
    }

    if (message.length > 160) {
      logger.warn(`Message length (${message.length}) exceeds 160 characters for ${recipient}`);
    }

    try {
      let response: SMSResponse;

      switch (route) {
        case 'normal':
          response = await this.sendSMSNormal(recipient, message, sender);
          break;
        case 'dnd':
          response = await this.sendSMSDND(recipient, message, sender);
          break;
        case 'fallback':
        default:
          response = await this.sendSMSWithFallback(recipient, message, sender);
          break;
      }

      // Log message details for audit
      logger.info('SMS sent successfully', {
        recipient: this.normalizePhoneNumber(recipient),
        route,
        priority,
        messageLength: message.length,
        batchCode: response.batchCode,
        messageId: response.messages[0]?.messageId
      });

      return response;
    } catch (error) {
      logger.error('Failed to send text message', { 
        recipient: this.normalizePhoneNumber(recipient), 
        route, 
        priority,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send verification code (replaces Twilio's sendVerificationCode)
   */
  async sendVerificationCode(phoneNumber: string): Promise<{ status: string; sid?: string }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Clean up any existing OTP for this number
      this.otpStorage.delete(normalizedPhone);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

      // Create OTP message
      const message = `Your verification code is: ${otp}. This code expires in ${this.otpExpiryMinutes} minutes. Do not share this code with anyone.`;

      // Send SMS
      const smsResponse = await this.sendTextMessage(normalizedPhone, message, {
        route: 'fallback',
        priority: 'high'
      });

      // Store OTP in memory
      const otpRecord: OTPRecord = {
        otp,
        phoneNumber: normalizedPhone,
        expiresAt,
        attempts: 0,
        maxAttempts: this.maxOtpAttempts,
        createdAt: new Date()
      };

      this.otpStorage.set(normalizedPhone, otpRecord);

      logger.info(`Verification code sent to ${normalizedPhone}`, {
        messageId: smsResponse.messages[0]?.messageId,
        expiresAt: expiresAt.toISOString()
      });

      // Return format compatible with Twilio's response
      return {
        status: 'pending',
        sid: smsResponse.messages[0]?.messageId || `otp_${Date.now()}`
      };
    } catch (error) {
      logger.error('Failed to send verification code', { 
        phoneNumber: this.normalizePhoneNumber(phoneNumber), 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to send verification code. Please try again.', 500);
    }
  }

  /**
   * Check verification code (replaces Twilio's checkVerificationCode)
   */
  async checkVerificationCode(
    phoneNumber: string, 
    otp: string
  ): Promise<{ status: 'approved' | 'pending' | 'failed'; valid?: boolean }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const otpRecord = this.otpStorage.get(normalizedPhone);

      if (!otpRecord) {
        logger.warn(`No OTP record found for ${normalizedPhone}`);
        throw new ApiError('No verification code found. Please request a new code.', 400);
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        this.otpStorage.delete(normalizedPhone);
        logger.warn(`Expired OTP verification attempt for ${normalizedPhone}`);
        throw new ApiError('Verification code has expired. Please request a new code.', 400);
      }

      // Increment attempt count
      otpRecord.attempts++;

      // Check if max attempts exceeded
      if (otpRecord.attempts > otpRecord.maxAttempts) {
        this.otpStorage.delete(normalizedPhone);
        logger.warn(`Max OTP attempts exceeded for ${normalizedPhone}`);
        throw new ApiError('Maximum verification attempts exceeded. Please request a new code.', 400);
      }

      // Verify OTP
      if (otpRecord.otp !== otp.trim()) {
        logger.warn(`Invalid OTP attempt for ${normalizedPhone}`, {
          attempts: otpRecord.attempts,
          maxAttempts: otpRecord.maxAttempts
        });
        
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
          this.otpStorage.delete(normalizedPhone);
          throw new ApiError('Invalid verification code. Maximum attempts exceeded.', 400);
        }
        
        throw new ApiError(`Invalid verification code. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining.`, 400);
      }

      // OTP is valid - remove from storage
      this.otpStorage.delete(normalizedPhone);

      logger.info(`OTP verification successful for ${normalizedPhone}`, {
        attempts: otpRecord.attempts,
        timeToVerify: Date.now() - otpRecord.createdAt.getTime()
      });

      // Return format compatible with Twilio's response
      return {
        status: 'approved',
        valid: true
      };
    } catch (error) {
      logger.error('OTP verification failed', { 
        phoneNumber: this.normalizePhoneNumber(phoneNumber), 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Verification failed. Please try again.', 500);
    }
  }

  /**
   * Get OTP status for debugging (development only)
   */
  getOTPStatus(phoneNumber: string): { exists: boolean; attempts?: number; expiresAt?: string } {
    if (process.env.NODE_ENV === 'production') {
      return { exists: false };
    }

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const otpRecord = this.otpStorage.get(normalizedPhone);
    if (!otpRecord) {
      return { exists: false };
    }

    return {
      exists: true,
      attempts: otpRecord.attempts,
      expiresAt: otpRecord.expiresAt.toISOString()
    };
  }

  /**
   * Clean up resources when service is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.otpStorage.clear();
    logger.info('SMS Experience Service destroyed');
  }
}

// Create singleton instance
const smsService = SMSExperienceService.getInstance();

// Export functions with the same signature as the original Twilio implementation
export const sendVerificationCode = async (phoneNumber: string) => {
  return await smsService.sendVerificationCode(phoneNumber);
};

export const checkVerificationCode = async (phoneNumber: string, otp: string) => {
  return await smsService.checkVerificationCode(phoneNumber, otp);
};

export const sendTextMessage = async (
  recipient: string, 
  message: string, 
  options?: {
    sender?: string;
    route?: 'normal' | 'dnd' | 'fallback';
    priority?: 'high' | 'normal';
  }
) => {
  return await smsService.sendTextMessage(recipient, message, options);
};

export const checkSMSBalance = async () => {
  return await smsService.checkBalance();
};

// Export service instance for advanced usage
export { smsService as SMSExperienceService };

// Handle process cleanup
process.on('beforeExit', () => {
  smsService.destroy();
});

process.on('SIGINT', () => {
  smsService.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  smsService.destroy();
  process.exit(0);
});