import { z } from 'zod';

// Bank account verification schema
export const verifyAccountSchema = z.object({
  body: z.object({
    accountNumber: z
      .string()
      .min(10, 'Account number must be at least 10 digits')
      .max(10, 'Account number must be exactly 10 digits')
      .regex(/^\d+$/, 'Account number must contain only digits')
      .transform(val => val.trim()),
    
    bankCode: z
      .string()
      .min(3, 'Bank code must be at least 3 characters')
      .max(6, 'Bank code must be exactly 6 characters')
      .regex(/^\d+$/, 'Bank code must contain only digits')
      .transform(val => val.trim())
  })
});

// Bank search schema
export const bankSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(val => parseInt(val))
      .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),
    offset: z
      .string()
      .regex(/^\d+$/, 'Offset must be a number')
      .transform(val => parseInt(val))
      .refine(val => val >= 0, 'Offset must be greater than or equal to 0')
      .optional()
  })
});

// Bank code validation schema
export const bankCodeSchema = z.object({
  params: z.object({
    bankCode: z
      .string()
      .min(3, 'Bank code must be at least 3 characters')
      .max(6, 'Bank code must be exactly 6 characters')
      .regex(/^\d+$/, 'Bank code must contain only digits')
  })
});

export type VerifyAccountInput = z.infer<typeof verifyAccountSchema>;
export type BankSearchInput = z.infer<typeof bankSearchSchema>;
export type BankCodeInput = z.infer<typeof bankCodeSchema>;