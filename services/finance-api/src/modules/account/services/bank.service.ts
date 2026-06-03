import { prisma } from '@/prisma';
import { bankAccountVerification } from '../utils/bankVerification';
import { 
  BankAccountVerificationInput, 
  BankAccountVerificationResponse, 
  BankAccountVerificationResult, 
  BankVerificationError,
  Bank,
  BankSearchResult,
  BankSearchParams 
} from '../interfaces/bank.interface';
import logger from '../../../utils/logger';

export class BankService {
  /**
   * Search banks by name with optional pagination
   */
  async searchBanks(searchTerm: string, options?: { limit?: number; offset?: number }): Promise<BankSearchResult> {
    try {
      const { limit = 50, offset = 0 } = options || {};
      
      const whereClause = {
        name: {
          contains: searchTerm,
          mode: 'insensitive' as const
        },
        status: true
      };

      const [banks, total] = await Promise.all([
        prisma.bank.findMany({
          where: whereClause,
          orderBy: {
            name: 'asc'
          },
          select: {
            id: true,
            name: true,
            code: true
          },
          take: limit,
          skip: offset
        }),
        prisma.bank.count({
          where: whereClause
        })
      ]);

      return {
        banks: banks as Bank[],
        total
      };
    } catch (error) {
      logger.error('Failed to search banks:', error);
      throw new Error('Failed to search banks');
    }
  }

  /**
   * Get all active banks with optional pagination
   */
  async getAllBanks(options?: { limit?: number; offset?: number }): Promise<BankSearchResult> {
    try {
      const { limit = 100, offset = 0 } = options || {};
      
      const whereClause = {
        status: true
      };

      const [banks, total] = await Promise.all([
        prisma.bank.findMany({
          where: whereClause,
          orderBy: {
            name: 'asc'
          },
          select: {
            id: true,
            name: true,
            code: true
          },
          take: limit,
          skip: offset
        }),
        prisma.bank.count({
          where: whereClause
        })
      ]);

      return {
        banks: banks as Bank[],
        total
      };
    } catch (error) {
      logger.error('Failed to fetch banks:', error);
      throw new Error('Failed to fetch banks');
    }
  }

  /**
   * Get bank by code
   */
  async getBankByCode(bankCode: string): Promise<Bank | null> {
    try {
      const bank = await prisma.bank.findFirst({
        where: {
          code: bankCode,
          status: true
        },
        select: {
          id: true,
          name: true,
          code: true
        }
      });

      return bank as Bank | null;
    } catch (error) {
      logger.error('Failed to fetch bank by code:', error);
      throw new Error('Failed to fetch bank by code');
    }
  }

  /**
   * Verify bank account
   */
  async verifyAccount(input: BankAccountVerificationInput): Promise<BankAccountVerificationResponse> {
    try {
      // Validate bank code exists
      const bank = await this.getBankByCode(input.bankCode);
      if (!bank) {
        return {
          status: 'error',
          message: 'Invalid bank code provided',
          accountName: undefined
        } as BankVerificationError;
      }

      const result = await bankAccountVerification.verifyAccount({
        accountNumber: input.accountNumber,
        bankCode: input.bankCode
      });

      // Check if the result indicates success
      if (result.status === 'success') {
        return {
          status: 'success',
          accountName: result.accountName,
          accountNumber: result.accountNumber,
          bankName: result.bankName || bank.name,
          firstName: result.firstName,
          lastName: result.lastName,
          otherName: result.otherName
        } as BankAccountVerificationResult;
      } else {
        return {
            status: 'error',
            message: result || 'Account verification failed',
            accountName: result.accountName
        } as unknown as BankVerificationError;
      }
    } catch (error) {
      logger.error('Error in verifyAccount:', error);
      
      // Return error response instead of throwing
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Account verification failed',
        accountName: undefined
      } as BankVerificationError;
    }
  }

  /**
   * Get popular banks (most commonly used)
   */
  async getPopularBanks(limit: number = 10): Promise<Bank[]> {
    try {
      const popularBankCodes = [
        '000044', // Access Bank
        '000004', // United Bank for Africa
        '000015', // Zenith Bank
        '000013', // Guaranty Trust Bank
        '000018', // Union Bank of Nigeria
        '000016', // First Bank of Nigeria
        '000012', // Stanbic IBTC Bank
        '000017', // Wema Bank
        '000007', // Fidelity Bank
        '000003'  // First City Monument Bank
      ];

      const banks = await prisma.bank.findMany({
        where: {
          code: {
            in: popularBankCodes
          },
          status: true
        },
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
          code: true
        },
        take: limit
      });

      return banks as Bank[];
    } catch (error) {
      logger.error('Failed to fetch popular banks:', error);
      throw new Error('Failed to fetch popular banks');
    }
  }
}