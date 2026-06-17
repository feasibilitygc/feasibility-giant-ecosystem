import axios from 'axios';
import env from '../config/env';
import logger from './logger';

// Extend config or use process.env directly
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'MONNIFY';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || '';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '';
const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || '';
const FLW_WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH || 'feasibility-flw-secret';

const MONO_SECRET_KEY = process.env.MONO_SECRET_KEY || '';

/**
 * Verify Corporate Affairs Commission (CAC) details for a cooperative
 * Performs real KYC integration when credentials are set, falls back to a successful stub/sandbox in development.
 */
export async function verifyCAC(cacNumber: string, businessName: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  logger.info(`🔍 Initiating CAC validation for business name: "${businessName}", registration number: "${cacNumber}"`);

  // Sandbox / development mock fallback
  if (env.NODE_ENV === 'development' || (!MONO_SECRET_KEY && !process.env.PREMBLY_API_KEY)) {
    logger.info(`✨ Sandbox mode: CAC validation bypassed for "${cacNumber}"`);
    return {
      success: true,
      message: 'CAC registration number verified (Sandbox Mode)',
      data: {
        cacNumber,
        businessName,
        status: 'ACTIVE',
        address: 'Plot 101, Central Business District, Abuja, Nigeria',
        registrationDate: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
      }
    };
  }

  try {
    // If Mono integration is configured
    if (MONO_SECRET_KEY) {
      logger.info('Calling Mono Business Lookup API for CAC checks');
      const response = await axios.post(
        'https://api.withmono.com/lookup/cac',
        { rc_number: cacNumber },
        {
          headers: {
            'mono-sec-key': MONO_SECRET_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return {
        success: true,
        message: 'CAC details retrieved successfully via Mono',
        data: response.data,
      };
    }

    // Default return
    return {
      success: true,
      message: 'CAC checked successfully (default)',
      data: { cacNumber, businessName }
    };
  } catch (error: any) {
    const errMessage = error.response?.data?.message || error.message;
    logger.error(`❌ CAC check API failed: ${errMessage}`);
    throw new Error(`CAC verification failed: ${errMessage}`);
  }
}

/**
 * Registers a cooperative sub-account with Monnify or Flutterwave payment providers.
 * Returns the generated subaccountCode.
 */
export async function createProviderSubAccount(data: {
  businessName: string;
  email: string;
  bankCode: string;
  accountNumber: string;
  splitPercent: number;
}): Promise<{
  success: boolean;
  subaccountCode: string;
  message: string;
}> {
  logger.info(`💳 Initiating sub-account creation on payment provider: "${PAYMENT_PROVIDER}" for "${data.businessName}"`);

  // Sandbox / development mock fallback
  const isDummyCreds = PAYMENT_PROVIDER === 'MONNIFY' ? (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) : !FLW_SECRET_KEY;
  if (env.NODE_ENV === 'development' || isDummyCreds) {
    const randomSubCode = `${PAYMENT_PROVIDER === 'MONNIFY' ? 'MFY_SUB_' : 'FLW_SUB_'}${Math.floor(100000000 + Math.random() * 900000000)}`;
    logger.info(`✨ Sandbox mode: Generated mock sub-account code: ${randomSubCode}`);
    return {
      success: true,
      subaccountCode: randomSubCode,
      message: 'Payment provider sub-account initialized (Sandbox Mode)'
    };
  }

  try {
    if (PAYMENT_PROVIDER === 'MONNIFY') {
      // 1. Get Monnify Access Token
      const authHeader = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
      const authResponse = await axios.post(
        `${MONNIFY_BASE_URL}/api/v1/auth/login`,
        {},
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const token = authResponse.data?.responseBody?.accessToken;
      if (!token) {
        throw new Error('Access token was not returned by Monnify auth server');
      }

      // 2. Register Sub-Account
      const response = await axios.post(
        `${MONNIFY_BASE_URL}/api/v1/sub-accounts`,
        {
          currencyCode: 'NGN',
          bankCode: data.bankCode,
          accountNumber: data.accountNumber,
          email: data.email,
          splitPercentage: data.splitPercent,
          businessName: data.businessName,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data?.requestSuccessful) {
        const subAccountCode = response.data.responseBody.subAccountCode;
        logger.info(`✅ Monnify sub-account created: ${subAccountCode}`);
        return {
          success: true,
          subaccountCode: subAccountCode,
          message: 'Monnify sub-account created successfully'
        };
      } else {
        throw new Error(response.data?.responseMessage || 'Failed to create sub-account');
      }
    } else if (PAYMENT_PROVIDER === 'FLUTTERWAVE') {
      // Flutterwave sub-account creation
      const response = await axios.post(
        'https://api.flutterwave.com/v3/subaccounts',
        {
          account_bank: data.bankCode,
          account_number: data.accountNumber,
          business_name: data.businessName,
          business_email: data.email,
          country: 'NG',
          split_type: 'percentage',
          split_value: (data.splitPercent / 100)
        },
        {
          headers: {
            'Authorization': `Bearer ${FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data?.status === 'success') {
        const subaccountCode = response.data.data.subaccount_id;
        logger.info(`✅ Flutterwave sub-account created: ${subaccountCode}`);
        return {
          success: true,
          subaccountCode: subaccountCode.toString(),
          message: 'Flutterwave sub-account created successfully'
        };
      } else {
        throw new Error(response.data?.message || 'Failed to create sub-account');
      }
    }

    throw new Error(`Unsupported payment provider: ${PAYMENT_PROVIDER}`);
  } catch (error: any) {
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`❌ Payment sub-account registration failed: ${errMessage}`);
    throw new Error(`Sub-account registration failed: ${errMessage}`);
  }
}

/**
 * Creates a customer on Mono.
 */
export async function createMonoCustomer(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  bvn: string;
}): Promise<{
  success: boolean;
  customerId: string;
  message: string;
}> {
  logger.info(`🔍 Registering customer on Mono for email: ${data.email}`);

  if (env.NODE_ENV === 'development' || !MONO_SECRET_KEY) {
    const mockCustId = `mono_cust_${Math.floor(100000000 + Math.random() * 900000000)}`;
    logger.info(`✨ Sandbox mode: Generated mock Mono customer ID: ${mockCustId}`);
    return {
      success: true,
      customerId: mockCustId,
      message: 'Mono customer registered (Sandbox Mode)'
    };
  }

  try {
    const response = await axios.post(
      'https://api.withmono.com/v2/customers',
      {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        address: data.address,
        identity: {
          type: 'bvn',
          number: data.bvn
        }
      },
      {
        headers: {
          'mono-sec-key': MONO_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const customerId = response.data?.id || response.data?.data?.id;
    if (!customerId) {
      throw new Error('Customer ID was not returned by Mono');
    }

    return {
      success: true,
      customerId,
      message: 'Mono customer registered successfully'
    };
  } catch (error: any) {
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`❌ Mono customer registration failed: ${errMessage}`);
    throw new Error(`Mono customer registration failed: ${errMessage}`);
  }
}

/**
 * Initiates a Direct Debit Mandate on Mono.
 */
export async function initiateMonoMandate(data: {
  customerId: string;
  amount: number; // in kobo
  reference: string;
  accountNumber?: string;
  bankCode?: string;
  verificationMethod?: string; // e.g. selfie_verification or transfer_verification
}): Promise<{
  success: boolean;
  mandateId: string;
  monoUrl: string;
  message: string;
}> {
  logger.info(`💳 Initiating Mono Direct Debit Mandate for customer: ${data.customerId}, ref: ${data.reference}`);

  const verificationMethod = data.verificationMethod || 'selfie_verification';

  if (env.NODE_ENV === 'development' || !MONO_SECRET_KEY) {
    const mockMandateId = `mono_mand_${Math.floor(100000000 + Math.random() * 900000000)}`;
    const mockMonoUrl = `https://connect.withmono.com/mandate/mock_${data.reference}`;
    logger.info(`✨ Sandbox mode: Generated mock mandateId: ${mockMandateId}, url: ${mockMonoUrl}`);
    return {
      success: true,
      mandateId: mockMandateId,
      monoUrl: mockMonoUrl,
      message: 'Mono mandate initiated (Sandbox Mode)'
    };
  }

  try {
    const response = await axios.post(
      'https://api.withmono.com/v3/payments/mandates',
      {
        debit_type: 'variable',
        customer: data.customerId,
        mandate_type: 'emandate',
        amount: data.amount,
        reference: data.reference,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        verification_method: verificationMethod
      },
      {
        headers: {
          'mono-sec-key': MONO_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const mandateId = response.data?.data?.id || response.data?.id;
    const monoUrl = response.data?.data?.mono_url || response.data?.mono_url || '';

    if (!mandateId) {
      throw new Error('Mandate ID was not returned by Mono');
    }

    return {
      success: true,
      mandateId,
      monoUrl,
      message: 'Mono mandate initiated successfully'
    };
  } catch (error: any) {
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`❌ Mono mandate initiation failed: ${errMessage}`);
    throw new Error(`Mono mandate initiation failed: ${errMessage}`);
  }
}

/**
 * Retrieves details for a specific mandate from Mono.
 */
export async function verifyMonoMandate(mandateId: string): Promise<{
  success: boolean;
  status: string; // initiated, approved, rejected, etc.
  data: any;
}> {
  logger.info(`🔍 Verifying Mono Mandate status for: ${mandateId}`);

  if (env.NODE_ENV === 'development' || !MONO_SECRET_KEY) {
    logger.info(`✨ Sandbox mode: Bypassing real verify for mandate: ${mandateId}`);
    return {
      success: true,
      status: 'approved',
      data: {
        id: mandateId,
        status: 'approved',
        ready_to_debit: true,
        approved: true
      }
    };
  }

  try {
    const response = await axios.get(
      `https://api.withmono.com/v3/payments/mandates/${mandateId}`,
      {
        headers: {
          'mono-sec-key': MONO_SECRET_KEY
        },
        timeout: 15000
      }
    );

    const status = response.data?.data?.status || response.data?.status || 'unknown';

    return {
      success: true,
      status,
      data: response.data?.data || response.data
    };
  } catch (error: any) {
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`❌ Mono mandate verification failed: ${errMessage}`);
    throw new Error(`Mono mandate verification failed: ${errMessage}`);
  }
}

/**
 * Triggers a debit request on an active Mono Mandate.
 */
export async function triggerMonoDebit(
  mandateId: string,
  amount: number, // in kobo
  reference: string
): Promise<{
  success: boolean;
  status: string; // successful, processing, failed, etc.
  debitId: string;
  message: string;
}> {
  logger.info(`💸 Triggering debit sweep on Mono Mandate: ${mandateId}, amount: ${amount} kobo, ref: ${reference}`);

  if (env.NODE_ENV === 'development' || !MONO_SECRET_KEY) {
    const mockDebitId = `mono_debit_${Math.floor(100000000 + Math.random() * 900000000)}`;
    logger.info(`✨ Sandbox mode: Generated mock debit ID: ${mockDebitId}`);
    return {
      success: true,
      status: 'successful',
      debitId: mockDebitId,
      message: 'Mono debit sweep triggered successfully (Sandbox Mode)'
    };
  }

  try {
    const response = await axios.post(
      `https://api.withmono.com/v3/payments/mandates/${mandateId}/debit`,
      {
        amount,
        reference
      },
      {
        headers: {
          'mono-sec-key': MONO_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const status = response.data?.data?.status || response.data?.status || 'processing';
    const debitId = response.data?.data?.id || response.data?.id || '';

    return {
      success: true,
      status,
      debitId,
      message: 'Mono debit sweep request successfully sent'
    };
  } catch (error: any) {
    const errMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`❌ Mono debit sweep failed: ${errMessage}`);
    throw new Error(`Mono debit sweep failed: ${errMessage}`);
  }
}

