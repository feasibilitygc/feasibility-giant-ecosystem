export interface BankVerificationRequest {
  accountNumber: string;
  bankCode: string;
}

export interface BankVerificationSuccess {
  firstName?: string;
  lastName?: string;
  otherName?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  status: 'success' | 'error';
}

export interface BankAccountVerificationInput {
  accountNumber: string;
  bankCode: string;
}

export interface BankAccountVerificationResult {
  firstName?: string;
  lastName?: string;
  otherName?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  status: 'success' | 'error';
}

export interface BankVerificationError {
  status: 'error';
  message: string | undefined;
  accountName?: string;
}

// Bank data interfaces
export interface Bank {
  id: string;
  name: string;
  code: string;
}

export interface BankSearchResult {
  banks: Bank[];
  total: number;
}

export interface BankSearchParams {
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export type BankVerificationResponse = BankVerificationSuccess | BankVerificationError;
export type BankAccountVerificationResponse = BankAccountVerificationResult | BankVerificationError;