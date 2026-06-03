import { Request, Response, NextFunction } from 'express';
import { BankService } from '../services/bank.service';
import { bankCodeSchema, bankSearchSchema, verifyAccountSchema } from '../validations/bank.validation';
import { BankAccountVerificationInput, BankVerificationError } from '../interfaces/bank.interface';
import { ApiResponse } from '../../../utils/apiResponse';
import { ZodError } from 'zod';
import logger from '../../../utils/logger';

export class BankController {
    private bankService: BankService;
    
    constructor() {
        this.bankService = new BankService();
    }
    
    /**
     * Search banks by name with optional pagination
     */
    searchBanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = bankSearchSchema.parse(req);
            const { q: searchTerm, limit, offset } = validated.query;
            
            if (!searchTerm) {
                const result = await this.bankService.getAllBanks({ limit, offset });
                return ApiResponse.success(res, 'Banks retrieved successfully', result);
            }
            
            const result = await this.bankService.searchBanks(searchTerm, { limit, offset });
            return ApiResponse.success(res, 'Banks search completed successfully', result);
        } catch (error) {
            logger.error('Error in searchBanks:', error);
            next(error);
        }
    };

    /**
     * Get all banks with optional pagination
     */
    getAllBanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = bankSearchSchema.parse(req);
            const { limit, offset } = validated.query;
            
            const result = await this.bankService.getAllBanks({ limit, offset });
            return ApiResponse.success(res, 'All banks retrieved successfully', result);
        } catch (error) {
            logger.error('Error in getAllBanks:', error);
            next(error);
        }
    };

    /**
     * Get popular banks
     */
    getPopularBanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            
            const banks = await this.bankService.getPopularBanks(limit);
            return ApiResponse.success(res, 'Popular banks retrieved successfully', { banks, total: banks.length });
        } catch (error) {
            logger.error('Error in getPopularBanks:', error);
            next(error);
        }
    };

    /**
     * Get bank by code
     */
    getBankByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = bankCodeSchema.parse(req);
            const { bankCode } = validated.params;
                        
            if (!bankCode) {
                return ApiResponse.badRequest(res, 'Bank code is required');
            }
            
            const bank = await this.bankService.getBankByCode(bankCode);
            
            if (!bank) {
                return ApiResponse.notFound(res, 'Bank not found');
            }
            
            return ApiResponse.success(res, 'Bank retrieved successfully', bank);
        } catch (error) {
            logger.error('Error in getBankByCode:', error);
            next(error);
        }
    };
    
    /**
     * Verify bank account
     */
    verifyAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = verifyAccountSchema.parse(req);
            const validatedData: BankAccountVerificationInput = validated.body;
            
            const result = await this.bankService.verifyAccount(validatedData);
            
            // Check if the result is an error
            if (result.status === 'error') {
                const errorResult = result as BankVerificationError;
                return ApiResponse.badRequest(res, errorResult.message || 'Account verification failed');
            }
            
            // If the result is successful, return the success response
            return ApiResponse.success(res, 'Account verified successfully', result);
        } catch (error: unknown) {
            logger.error('Error in verifyAccount:', error);
            
            if (error instanceof ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                return ApiResponse.badRequest(res, `Invalid input data: ${errorMessage}`);
            }
            
            next(error);
        }
    };
}

export const bankController = new BankController();