
// SMS Experience API Response Types
export interface SMSResponse {
  batchCode: string;
  batchDescription: string;
  messages: SMSMessageStatus[];
}

export interface SMSMessageStatus {
  statusCode: string;
  recipient: string;
  messageId: string;
  messageStatus: 'SENT' | 'REJECTED' | 'DND_SENT' | 'DND_REJECTED';
  statusDescription: string;
}

export interface BalanceResponse {
  balance: number;
  status: string;
}

// OTP Storage interface for in-memory storage
export interface OTPRecord {
  otp: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}


// SMS Routes
export enum SMS_ROUTES {
  NORMAL = 'sendsms',
  DND = 'dnd-route',
  DND_FALLBACK = 'dnd-fallback',
  BALANCE = 'balance',
}

// Interfaces
// export interface SMSResponse {
//   success: boolean;
//   statusCode: string;
//   message: string;
//   messageId?: string;
//   recipientStatus?: Array<{
//     recipient: string;
//     messageId: string;
//     status: string;
//     description: string;
//   }>;
//   balance?: number;
// }

// export interface OTPRecord {
//   id: string;
//   phoneNumber: string;
//   otp: string;
//   attempts: number;
//   isUsed: boolean;
//   expiresAt: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface VerificationResult {
  status: 'approved' | 'pending' | 'failed';
  message?: string;
  attempts?: number;
  valid?: boolean;
}

export interface SendSMSOptions {
  route?: SMS_ROUTES;
  sender?: string;
  retryOnFailure?: boolean;
  logResponse?: boolean;
  priority?: string;
}
