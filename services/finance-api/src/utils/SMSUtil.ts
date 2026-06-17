import axios, { AxiosResponse } from 'axios';
import twilio from 'twilio';
import { ApiError } from './apiError';
import logger from './logger';
import env from '../config/env';
import { prisma } from './prisma';
import { getCooperativeId } from './contextStore';
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
  private readonly twilioClient?: twilio.Twilio;

  constructor() {
    // Validate required environment variables
    this.username = env.SMS_EXPERIENCE_USERNAME;
    this.password = env.SMS_EXPERIENCE_PASSWORD;
    this.defaultSender = env.SMS_EXPERIENCE_SENDER_ID || 'SMS_EXP';
    this.otpExpiryMinutes = env.OTP_EXPIRY_MINUTES || 5;
    this.maxOtpAttempts = env.MAX_OTP_ATTEMPTS || 3;

    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }

    const activeProvider = env.SMS_PROVIDER || 'SMS_EXPERIENCE';
    if (activeProvider === 'SMS_EXPERIENCE' && (!this.username || !this.password)) {
      logger.warn('SMS Experience credentials not configured. SMS Experience will fail if used.');
    }
    if (activeProvider === 'TWILIO' && (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN)) {
      logger.warn('Twilio credentials not configured. Twilio will fail if used.');
    }

    // Setup periodic cleanup of expired OTPs
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredOTPs();
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    logger.info('SMS Service initialized successfully');
  }

  static getInstance(): SMSExperienceService {
    if (!SMSExperienceService.instance) {
      SMSExperienceService.instance = new SMSExperienceService();
    }
    return SMSExperienceService.instance;
  }

  /**
   * Save SMS log to the database for auditing and billing
   */
  private async saveSmsLog(
    recipient: string,
    provider: 'TWILIO' | 'SMS_EXPERIENCE',
    status: 'SENT' | 'FAILED',
    errorDetails?: string
  ): Promise<void> {
    try {
      const cooperativeId = getCooperativeId();
      await prisma.smsLog.create({
        data: {
          recipient,
          provider,
          messageStatus: status,
          errorDetails: errorDetails || null,
          cooperativeId: cooperativeId || null
        }
      });
    } catch (dbError: any) {
      logger.error('Failed to save SMS log to database', { error: dbError.message });
    }
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
        
        if (messageParts.length < 5) {
          throw new Error(`Invalid message entry format - expected at least 5 parts, got ${messageParts.length}`);
        }

        const statusCode = messageParts[0]?.trim();
        const recipient = messageParts[1]?.trim();
        const messageId = messageParts[2]?.trim();
        const messageStatus = messageParts[3]?.trim();
        const statusDescription = messageParts[4]?.trim();

        if (!statusCode || !recipient || !messageId || !messageStatus || !statusDescription) {
          throw new Error('Missing required fields in message entry');
        }

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
            normalizedStatus = 'SENT';
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
    const activeProvider = env.SMS_PROVIDER || 'SMS_EXPERIENCE';
    if (activeProvider === 'TWILIO') {
      return {
        balance: 9999.99,
        status: 'success'
      };
    }

    try {
      const params = new URLSearchParams({
        username: this.username,
        password: this.password
      });

      logger.info('Checking SMS Experience account balance');

      const response: AxiosResponse<any> = await axios.get(
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

      const balanceData = response.data;
      const balanceText = typeof balanceData === 'string' ? balanceData.trim() : String(balanceData || '');
      const balance = parseFloat(balanceText) || 0;

      logger.info(`SMS Experience account balance: ${balance}`);

      return {
        balance,
        status: 'success'
      };
    } catch (error: any) {
      logger.error('Failed to check SMS balance', { error: error.message });
      // Fallback to Twilio mock if configured
      if (this.twilioClient) {
        return {
          balance: 9999.99,
          status: 'success'
        };
      }
      
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

    if (!recipient || !message) {
      throw new ApiError('Recipient and message are required', 400);
    }

    if (message.length > 160) {
      logger.warn(`Message length (${message.length}) exceeds 160 characters for ${recipient}`);
    }

    const activeProvider = env.SMS_PROVIDER || 'SMS_EXPERIENCE';

    if (activeProvider === 'TWILIO') {
      try {
        const response = await this.sendSMSTwilio(recipient, message);
        await this.saveSmsLog(recipient, 'TWILIO', 'SENT');
        return response;
      } catch (error: any) {
        logger.warn(`Twilio primary message send failed. Retrying via SMS Experience fallback... Error: ${error.message}`);
        await this.saveSmsLog(recipient, 'TWILIO', 'FAILED', error.message);
        
        // Fallback to SMS Experience
        try {
          const response = await this.sendSMSExperience(recipient, message, route, sender);
          await this.saveSmsLog(recipient, 'SMS_EXPERIENCE', 'SENT');
          return response;
        } catch (fallbackError: any) {
          logger.error(`Fallback message send via SMS Experience failed: ${fallbackError.message}`);
          await this.saveSmsLog(recipient, 'SMS_EXPERIENCE', 'FAILED', fallbackError.message);
          throw new ApiError('Failed to send SMS message via all providers.', 500);
        }
      }
    } else {
      try {
        const response = await this.sendSMSExperience(recipient, message, route, sender);
        await this.saveSmsLog(recipient, 'SMS_EXPERIENCE', 'SENT');
        return response;
      } catch (error: any) {
        logger.warn(`SMS Experience primary message send failed. Retrying via Twilio fallback... Error: ${error.message}`);
        await this.saveSmsLog(recipient, 'SMS_EXPERIENCE', 'FAILED', error.message);
        
        // Fallback to Twilio
        if (this.twilioClient) {
          try {
            const response = await this.sendSMSTwilio(recipient, message);
            await this.saveSmsLog(recipient, 'TWILIO', 'SENT');
            return response;
          } catch (fallbackError: any) {
            logger.error(`Fallback message send via Twilio failed: ${fallbackError.message}`);
            await this.saveSmsLog(recipient, 'TWILIO', 'FAILED', fallbackError.message);
            throw new ApiError('Failed to send SMS message via all providers.', 500);
          }
        }
        throw error;
      }
    }
  }

  private async sendSMSTwilio(recipient: string, message: string): Promise<SMSResponse> {
    if (!this.twilioClient) {
      throw new Error('Twilio client is not initialized');
    }
    const normalizedRecipient = this.normalizePhoneNumber(recipient);
    let twilioTo = normalizedRecipient;
    if (!twilioTo.startsWith('+')) {
      twilioTo = '+' + twilioTo;
    }
    const fromNumber = env.TWILIO_PHONE_NUMBER || '';

    logger.info(`Sending SMS to ${twilioTo} via Twilio`);
    const response = await this.twilioClient.messages.create({
      body: message,
      to: twilioTo,
      from: fromNumber
    });

    logger.info(`SMS sent successfully to ${twilioTo} via Twilio, SID: ${response.sid}`);

    return {
      batchCode: 'TG00',
      batchDescription: 'Twilio Message Sent',
      messages: [
        {
          statusCode: '0000',
          recipient: normalizedRecipient,
          messageId: response.sid,
          messageStatus: 'SENT',
          statusDescription: 'Message successfully sent via Twilio'
        }
      ]
    };
  }

  private async sendSMSExperience(
    recipient: string,
    message: string,
    route: 'normal' | 'dnd' | 'fallback',
    sender?: string
  ): Promise<SMSResponse> {
    switch (route) {
      case 'normal':
        return await this.sendSMSNormal(recipient, message, sender);
      case 'dnd':
        return await this.sendSMSDND(recipient, message, sender);
      case 'fallback':
      default:
        return await this.sendSMSWithFallback(recipient, message, sender);
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber: string): Promise<{ status: string; sid?: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    // Clean up any existing OTP for this number
    this.otpStorage.delete(normalizedPhone);

    const activeProvider = env.SMS_PROVIDER || 'SMS_EXPERIENCE';

    if (activeProvider === 'TWILIO') {
      try {
        const result = await this.sendVerificationCodeTwilio(normalizedPhone);
        await this.saveSmsLog(normalizedPhone, 'TWILIO', 'SENT');
        
        const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
        this.otpStorage.set(normalizedPhone, {
          otp: '', // Twilio Verify manages OTP
          phoneNumber: normalizedPhone,
          expiresAt,
          attempts: 0,
          maxAttempts: this.maxOtpAttempts,
          createdAt: new Date(),
          provider: 'twilio'
        });
        return result;
      } catch (error: any) {
        logger.warn(`Failed to send OTP via primary Twilio. Retrying via SMS Experience fallback... Error: ${error.message}`);
        return await this.sendVerificationCodeSMSExperienceFallback(normalizedPhone);
      }
    } else {
      try {
        return await this.sendVerificationCodeSMSExperience(normalizedPhone);
      } catch (error: any) {
        logger.warn(`Failed to send OTP via primary SMS Experience. Retrying via Twilio fallback... Error: ${error.message}`);
        
        if (this.twilioClient) {
          try {
            const result = await this.sendVerificationCodeTwilio(normalizedPhone);
            await this.saveSmsLog(normalizedPhone, 'TWILIO', 'SENT');
            const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
            this.otpStorage.set(normalizedPhone, {
              otp: '',
              phoneNumber: normalizedPhone,
              expiresAt,
              attempts: 0,
              maxAttempts: this.maxOtpAttempts,
              createdAt: new Date(),
              provider: 'twilio'
            });
            return result;
          } catch (twilioError: any) {
            logger.error(`Fallback to Twilio OTP failed: ${twilioError.message}`);
            throw new ApiError('Failed to send verification code via all providers.', 500);
          }
        }
        throw error;
      }
    }
  }

  private async sendVerificationCodeTwilio(normalizedPhone: string): Promise<{ status: string; sid?: string }> {
    if (!this.twilioClient) {
      throw new Error('Twilio client is not initialized due to missing credentials');
    }
    const serviceSid = env.TWILIO_VERIFICATION_SERVICE_SID;
    if (!serviceSid) {
      throw new Error('Twilio Verification Service SID is not configured');
    }
    let twilioTo = normalizedPhone;
    if (!twilioTo.startsWith('+')) {
      twilioTo = '+' + twilioTo;
    }

    logger.info(`Sending verification code to ${twilioTo} via Twilio Verify`);
    const verification = await this.twilioClient.verify.v2.services(serviceSid)
      .verifications
      .create({ to: twilioTo, channel: 'sms' });

    logger.info(`Verification code sent via Twilio Verify, status: ${verification.status}`);
    return {
      status: verification.status,
      sid: verification.sid || `otp_tw_${Date.now()}`
    };
  }

  private async sendVerificationCodeSMSExperience(normalizedPhone: string): Promise<{ status: string; sid?: string }> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
    const message = `Your verification code is: ${otp}. This code expires in ${this.otpExpiryMinutes} minutes. Do not share this code with anyone.`;

    const smsResponse = await this.sendTextMessage(normalizedPhone, message, {
      route: 'fallback',
      priority: 'high'
    });

    const otpRecord: OTPRecord = {
      otp,
      phoneNumber: normalizedPhone,
      expiresAt,
      attempts: 0,
      maxAttempts: this.maxOtpAttempts,
      createdAt: new Date(),
      provider: 'sms_experience'
    };

    this.otpStorage.set(normalizedPhone, otpRecord);

    logger.info(`Verification code sent to ${normalizedPhone} via SMS Experience`, {
      messageId: smsResponse.messages[0]?.messageId,
      expiresAt: expiresAt.toISOString()
    });

    return {
      status: 'pending',
      sid: smsResponse.messages[0]?.messageId || `otp_se_${Date.now()}`
    };
  }

  private async sendVerificationCodeSMSExperienceFallback(normalizedPhone: string): Promise<{ status: string; sid?: string }> {
    if (!this.username || !this.password) {
      throw new Error('SMS Experience credentials not configured for fallback.');
    }
    try {
      const result = await this.sendVerificationCodeSMSExperience(normalizedPhone);
      return result;
    } catch (fallbackError: any) {
      logger.error(`Fallback to SMS Experience OTP failed: ${fallbackError.message}`);
      throw new ApiError('Failed to send verification code via all providers.', 500);
    }
  }

  /**
   * Check verification code
   */
  async checkVerificationCode(
    phoneNumber: string, 
    otp: string
  ): Promise<{ status: 'approved' | 'pending' | 'failed'; valid?: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const otpRecord = this.otpStorage.get(normalizedPhone);

    if (!otpRecord) {
      const activeProvider = env.SMS_PROVIDER || 'SMS_EXPERIENCE';
      if (activeProvider === 'TWILIO' && this.twilioClient && env.TWILIO_VERIFICATION_SERVICE_SID) {
        return await this.checkVerificationCodeTwilio(normalizedPhone, otp);
      }
      logger.warn(`No OTP record found for ${normalizedPhone}`);
      throw new ApiError('No verification code found. Please request a new code.', 400);
    }

    if (otpRecord.provider === 'twilio') {
      try {
        otpRecord.attempts++;
        if (otpRecord.attempts > otpRecord.maxAttempts) {
          this.otpStorage.delete(normalizedPhone);
          logger.warn(`Max OTP attempts exceeded for Twilio verification of ${normalizedPhone}`);
          throw new ApiError('Maximum verification attempts exceeded. Please request a new code.', 400);
        }

        const twilioResult = await this.checkVerificationCodeTwilio(normalizedPhone, otp);
        if (twilioResult.valid) {
          this.otpStorage.delete(normalizedPhone);
          return { status: 'approved', valid: true };
        } else {
          if (otpRecord.attempts >= otpRecord.maxAttempts) {
            this.otpStorage.delete(normalizedPhone);
            throw new ApiError('Invalid verification code. Maximum attempts exceeded.', 400);
          }
          throw new ApiError(`Invalid verification code. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining.`, 400);
        }
      } catch (error: any) {
        logger.error('Twilio Verify check failed:', { error: error.message });
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('Verification failed. Please try again.', 500);
      }
    } else {
      if (new Date() > otpRecord.expiresAt) {
        this.otpStorage.delete(normalizedPhone);
        logger.warn(`Expired OTP verification attempt for ${normalizedPhone}`);
        throw new ApiError('Verification code has expired. Please request a new code.', 400);
      }

      otpRecord.attempts++;

      if (otpRecord.attempts > otpRecord.maxAttempts) {
        this.otpStorage.delete(normalizedPhone);
        logger.warn(`Max OTP attempts exceeded for ${normalizedPhone}`);
        throw new ApiError('Maximum verification attempts exceeded. Please request a new code.', 400);
      }

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

      this.otpStorage.delete(normalizedPhone);

      logger.info(`OTP verification successful for ${normalizedPhone}`, {
        attempts: otpRecord.attempts,
        timeToVerify: Date.now() - otpRecord.createdAt.getTime()
      });

      return {
        status: 'approved',
        valid: true
      };
    }
  }

  private async checkVerificationCodeTwilio(
    normalizedPhone: string,
    otp: string
  ): Promise<{ status: 'approved' | 'pending' | 'failed'; valid?: boolean }> {
    if (!this.twilioClient) {
      throw new Error('Twilio client is not initialized');
    }
    const serviceSid = env.TWILIO_VERIFICATION_SERVICE_SID;
    if (!serviceSid) {
      throw new Error('Twilio Verification Service SID is not configured');
    }
    let twilioTo = normalizedPhone;
    if (!twilioTo.startsWith('+')) {
      twilioTo = '+' + twilioTo;
    }

    logger.info(`Checking verification code for ${twilioTo} via Twilio Verify`);
    const verificationCheck = await this.twilioClient.verify.v2.services(serviceSid)
      .verificationChecks
      .create({ to: twilioTo, code: otp });

    logger.info(`Verification check completed, status: ${verificationCheck.status}`);

    const status = verificationCheck.status;
    return {
      status: status === 'approved' ? 'approved' : 'failed',
      valid: status === 'approved'
    };
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
    logger.info('SMS Service destroyed');
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