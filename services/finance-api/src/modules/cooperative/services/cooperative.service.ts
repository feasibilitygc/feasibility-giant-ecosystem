import bcrypt from 'bcrypt';
import { prisma } from '@/prisma';
import { ApiError } from '../../../utils/apiError';

export interface RegisterCooperativeInput {
  name: string;
  registration_number: string;
  country: string;
  currency: string;
  admin_user: {
    name: string;
    email: string;
    password: string;
  };
  subdomain: string;
}

export class CooperativeService {
  async registerCooperative(input: RegisterCooperativeInput) {
    const { name, registration_number, country, currency, admin_user, subdomain } = input;

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

    // 3. Start a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the cooperative/tenant record
      const coop = await tx.cooperative.create({
        data: {
          name,
          subdomain,
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
              staffId: `ADM-${subdomain.toUpperCase().substring(0, 4)}-001`,
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
        portal_url: `https://${result.subdomain}.feasibilityfinance.com`
      }
    };
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
      },
      orderBy: { name: 'asc' },
    });

    return {
      status: 'success',
      data: cooperatives,
    };
  }
}
