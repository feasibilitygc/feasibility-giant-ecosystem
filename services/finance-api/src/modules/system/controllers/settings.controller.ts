import { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from '../services/systemSettings.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';

interface AuthRequest extends Request {
  user: {
    id: string;
    biodataId: string;
    roles: Array<{
      name: string;
      isAdmin: boolean;
    }>;
    permissions?: string[];
    approvalLevel: number;
  };
  session?: {
    id: string;
  };
}

export class SettingsController {
  private systemSettings: SystemSettingsService;

  constructor() {
    this.systemSettings = SystemSettingsService.getInstance();
  }

  // GET /settings
  async getAllSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Ensure settings are initialized
      await this.systemSettings.initializeDefaultSettings();

      const general = await this.systemSettings.getSetting<any>('GENERAL_SETTINGS').catch(() => ({}));
      const security = await this.systemSettings.getSetting<any>('SECURITY_SETTINGS').catch(() => ({}));
      const notifications = await this.systemSettings.getSetting<any>('NOTIFICATION_SETTINGS').catch(() => ({}));
      const advanced = await this.systemSettings.getSetting<any>('ADVANCED_SETTINGS').catch(() => ({}));

      return ApiResponse.success(res, 'System settings retrieved successfully', {
        general,
        security,
        notifications,
        advanced
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /settings/system
  async updateSystemSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('Unauthorized', 401);
      }

      const settingsData = req.body;
      const setting = await this.systemSettings.updateSetting(
        'GENERAL_SETTINGS',
        settingsData,
        req.user.id,
        req.body.reason || 'General settings update'
      );

      return ApiResponse.success(res, 'General settings updated successfully', JSON.parse(setting.value));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /settings/security
  async updateSecuritySettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('Unauthorized', 401);
      }

      const settingsData = req.body;
      const setting = await this.systemSettings.updateSetting(
        'SECURITY_SETTINGS',
        settingsData,
        req.user.id,
        req.body.reason || 'Security settings update'
      );

      return ApiResponse.success(res, 'Security settings updated successfully', JSON.parse(setting.value));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /settings/notifications
  async updateNotificationSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('Unauthorized', 401);
      }

      const settingsData = req.body;
      const setting = await this.systemSettings.updateSetting(
        'NOTIFICATION_SETTINGS',
        settingsData,
        req.user.id,
        req.body.reason || 'Notification settings update'
      );

      return ApiResponse.success(res, 'Notification settings updated successfully', JSON.parse(setting.value));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /settings/advanced
  async updateAdvancedSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('Unauthorized', 401);
      }

      const settingsData = req.body;
      const setting = await this.systemSettings.updateSetting(
        'ADVANCED_SETTINGS',
        settingsData,
        req.user.id,
        req.body.reason || 'Advanced settings update'
      );

      return ApiResponse.success(res, 'Advanced settings updated successfully', JSON.parse(setting.value));
    } catch (error) {
      next(error);
    }
  }
}
