import bcrypt from 'bcrypt';
import { prisma } from '@/prisma';
import { ApiError } from '../../../utils/apiError';
import { verifyCAC, createProviderSubAccount } from '../../../utils/paymentUtil';

export interface RegisterCooperativeInput {
  name: string;
  registration_number: string;
  cacNumber?: string;
  country: string;
  currency: string;
  admin_user: {
    name: string;
    email: string;
    password: string;
  };
  subdomain: string;
  settlementBankCode?: string;
  settlementAccountNumber?: string;
  splitPercent?: number;
}

export class CooperativeService {
  async registerCooperative(input: RegisterCooperativeInput) {
    const { 
      name, 
      registration_number, 
      cacNumber, 
      country, 
      currency, 
      admin_user, 
      subdomain,
      settlementBankCode,
      settlementAccountNumber,
      splitPercent 
    } = input;

    // 1. Verify subdomain availability (must be unique)
    const existingCooperative = await prisma.cooperative.findUnique({
      where: { subdomain }
    });

    if (existingCooperative) {
      throw new ApiError('Subdomain is already taken by another cooperative', 400);
    }

    // 2. Resolve default system role for the tenant admin
    // Note: Since this is a CLI seed bypass for transactions, prisma client bypasses scoping when no HTTP context is set
    const adminRole = await prisma.role.findFirst({
      where: {
        name: 'SUPER_ADMIN'
      }
    });

    if (!adminRole) {
      throw new ApiError('Default admin role not found in the database. Please seed the roles first.', 500);
    }

    // Hash the administrator's password
    const hashedPassword = await bcrypt.hash(admin_user.password, 10);

    // Verify admin email/username is unique before starting transaction
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: admin_user.email },
          { adminProfile: { emailAddress: admin_user.email } }
        ]
      }
    });

    if (existingUser) {
      throw new ApiError('An administrator user with this email address already exists.', 400);
    }

    // Verify staffId prefix availability
    const staffId = `ADM-${subdomain.toUpperCase().substring(0, 4)}-001`;
    const existingAdminProfile = await prisma.adminUserProfile.findUnique({
      where: { staffId }
    });

    if (existingAdminProfile) {
      throw new ApiError('A cooperative admin profile with this subdomain prefix already exists.', 400);
    }

    // Verify CAC before proceeding
    const resolvedCac = cacNumber || registration_number;
    const cacCheck = await verifyCAC(resolvedCac, name);
    if (!cacCheck.success) {
      throw new ApiError(cacCheck.message || 'CAC business validation failed.', 400);
    }

    // Call payment provider to generate sub-account code if settlement bank/account info is present
    let subaccountCode = null;
    if (settlementBankCode && settlementAccountNumber) {
      const subAccountResult = await createProviderSubAccount({
        businessName: name,
        email: admin_user.email,
        bankCode: settlementBankCode,
        accountNumber: settlementAccountNumber,
        splitPercent: splitPercent || 0.00
      });
      if (!subAccountResult.success) {
        throw new ApiError(subAccountResult.message || 'Sub-account registration failed.', 400);
      }
      subaccountCode = subAccountResult.subaccountCode;
    }

    try {
      // 3. Start a database transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Create the cooperative/tenant record
        const coop = await tx.cooperative.create({
          data: {
            name,
            subdomain,
            cacNumber: resolvedCac,
            splitPercent: splitPercent || 0.00,
            subaccountCode: subaccountCode,
            themeConfig: {
              primary_color: '#1A4F8B', // Default Primary Blue
              secondary_color: '#1FAF5A', // Default Emerald Green
              logo_url: null
            },
            systemSettings: {
              allow_self_registration: true,
              require_mfa: false
            }
          }
        });

        // Split first and last names for the AdminUserProfile
        const nameParts = admin_user.name.split(' ');
        const firstName = nameParts[0] || 'Cooperative';
        const lastName = nameParts.slice(1).join(' ') || 'Admin';

        // Create the tenant's admin User record (linked to cooperativeId)
        // Note: We bypass prisma dynamic scope here because the record is created with cooperativeId explicitly
        const user = await tx.user.create({
          data: {
            username: admin_user.email,
            password: hashedPassword,
            isActive: true,
            isMember: false, // Tenant administrators are staff, not members
            cooperativeId: coop.id,
            adminProfile: {
              create: {
                firstName,
                lastName,
                emailAddress: admin_user.email,
                phoneNumber: '0' + Math.floor(1000000000 + Math.random() * 9000000000), // Random unique placeholder
                department: 'Management',
                position: 'Cooperative Admin',
                staffId,
                isVerified: true,
                isActive: true
              }
            },
            roleAssignments: {
              create: {
                roleId: adminRole.id,
                isActive: true,
                assignedAt: new Date()
              }
            }
          }
        });

        return {
          cooperative_id: coop.id,
          subdomain: coop.subdomain,
          admin_user_id: user.id
        };
      });

      return {
        status: 'success',
        message: 'Cooperative initialized successfully.',
        data: {
          cooperative_id: result.cooperative_id,
          subdomain: result.subdomain,
          portal_url: `https://${result.subdomain}.feasibilityfinance.com`,
          subaccount_code: subaccountCode
        }
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');

        if (targetStr.includes('staffId')) {
          throw new ApiError('A cooperative admin profile with this subdomain prefix or staff ID already exists.', 400);
        }
        if (targetStr.includes('emailAddress') || targetStr.includes('username')) {
          throw new ApiError('An administrator user with this email address already exists.', 400);
        }
        if (targetStr.includes('phoneNumber')) {
          throw new ApiError('An administrator user with this phone number already exists.', 400);
        }
        throw new ApiError('Database unique constraint failed during registration.', 400);
      }
      throw error;
    }
  }

  /**
   * List all active cooperatives (public — used for frontend dropdowns)
   */
  async listCooperatives() {
    const cooperatives = await prisma.cooperative.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        subaccountCode: true,
        cacNumber: true,
        splitPercent: true
      },
      orderBy: { name: 'asc' },
    });

    return {
      status: 'success',
      data: cooperatives,
    };
  }

  /**
   * Registers a settlement sub-account post-onboarding for an existing cooperative.
   */
  async setupCooperativeSubaccount(cooperativeId: string, input: {
    settlementBankCode: string;
    settlementAccountNumber: string;
    splitPercent?: number;
  }) {
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId }
    });

    if (!cooperative) {
      throw new ApiError('Cooperative not found', 404);
    }

    const splitValue = input.splitPercent !== undefined ? input.splitPercent : Number(cooperative.splitPercent || 0);

    // Get the cooperative's admin email address to send to the payment provider
    const adminUser = await prisma.user.findFirst({
      where: { cooperativeId, isMember: false },
      select: { username: true }
    });

    const email = adminUser?.username || 'admin@cooperative.com';

    // Request the payment provider API (Monnify/Flutterwave) to register a sub-account code
    const subAccountResult = await createProviderSubAccount({
      businessName: cooperative.name,
      email,
      bankCode: input.settlementBankCode,
      accountNumber: input.settlementAccountNumber,
      splitPercent: splitValue,
    });

    if (!subAccountResult.success) {
      throw new ApiError(subAccountResult.message || 'Failed to create subaccount on payment provider', 400);
    }

    // Save subaccountCode and splitPercent back to Cooperative
    const updatedCooperative = await prisma.cooperative.update({
      where: { id: cooperativeId },
      data: {
        subaccountCode: subAccountResult.subaccountCode,
        splitPercent: splitValue
      }
    });

    return {
      status: 'success',
      message: 'Payment sub-account registered and configured successfully',
      data: {
        subaccountCode: updatedCooperative.subaccountCode,
        splitPercent: Number(updatedCooperative.splitPercent)
      }
    };
  }
}
