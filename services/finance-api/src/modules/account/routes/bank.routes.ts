import { Router } from "express";
import { bankController } from "../controllers/bank.controller";

const router = Router();

/**
 * @route GET /api/accounts/banks
 * @desc Get all banks with optional pagination
 * @query limit - Number of banks to return (default: 100)
 * @query offset - Number of banks to skip (default: 0)
 * @access Public
 */
router.get('/', bankController.getAllBanks);

/**
 * @route GET /api/accounts/banks/search
 * @desc Search banks by name with optional pagination
 * @query q - Search term (bank name)
 * @query limit - Number of banks to return (default: 50)
 * @query offset - Number of banks to skip (default: 0)
 * @access Public
 */
router.get('/search', bankController.searchBanks);

/**
 * @route GET /api/accounts/banks/popular
 * @desc Get popular banks (most commonly used)
 * @query limit - Number of banks to return (default: 10)
 * @access Public
 */
router.get('/popular', bankController.getPopularBanks);

/**
 * @route GET /api/accounts/banks/:bankCode
 * @desc Get bank by code
 * @param bankCode - Bank code
 * @access Public
 */
router.get('/:bankCode', bankController.getBankByCode);

/**
 * @route POST /api/accounts/banks/verify
 * @desc Verify bank account
 * @body accountNumber - Account number to verify
 * @body bankCode - Bank code
 * @access Public
 */
router.post('/verify', bankController.verifyAccount);

export default router;