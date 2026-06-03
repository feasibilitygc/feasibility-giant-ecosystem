import { Request, Response, NextFunction } from 'express';
import { CooperativeService } from '../services/cooperative.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';
import { z } from 'zod';
import { prisma } from '@/prisma';

export const registerCooperativeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  registration_number: z.string().min(2, 'Registration number is required'),
  country: z.string().min(2, 'Country is required'),
  currency: z.string().min(2, 'Currency is required'),
  admin_user: z.object({
    name: z.string().min(2, 'Admin name must be at least 2 characters'),
    email: z.string().email('Invalid admin email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, or dashes')
});

export class CooperativeController {
  private cooperativeService: CooperativeService;

  constructor() {
    this.cooperativeService = new CooperativeService();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerCooperativeSchema.parse(req.body);
      const result = await this.cooperativeService.registerCooperative(validatedData);
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponse.badRequest(res, 'Invalid registration input format');
      }
      next(error);
    }
  }

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const coopId = req.cooperativeId;
      if (!coopId) {
        throw new ApiError('Cooperative ID could not be resolved', 400);
      }

      // Fetch the cooperative configuration
      // Note: We bypass Prisma scoping context here because we are reading the metadata of the resolved cooperative
      const coop = await prisma.cooperative.findUnique({
        where: { id: coopId }
      });

      if (!coop) {
        throw new ApiError('Cooperative not found', 404);
      }

      return res.status(200).json({
        cooperative_id: coop.id,
        name: coop.name,
        subdomain: coop.subdomain,
        theme: coop.themeConfig || {
          primary_color: '#1A4F8B',
          secondary_color: '#1FAF5A',
          logo_url: null
        },
        settings: coop.systemSettings || {
          allow_self_registration: true,
          require_mfa: false
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.cooperativeService.listCooperatives();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

