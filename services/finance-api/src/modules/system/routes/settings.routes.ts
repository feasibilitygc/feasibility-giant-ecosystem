import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateUser, authorizeRoles } from '../../../middlewares/auth';

const router = Router();
const settingsController = new SettingsController();

// All settings routes are protected and restricted to SUPER_ADMIN role
router.use(authenticateUser);
router.use(authorizeRoles(['SUPER_ADMIN']));

router.get('/', settingsController.getAllSettings.bind(settingsController));
router.patch('/system', settingsController.updateSystemSettings.bind(settingsController));
router.patch('/security', settingsController.updateSecuritySettings.bind(settingsController));
router.patch('/notifications', settingsController.updateNotificationSettings.bind(settingsController));
router.patch('/advanced', settingsController.updateAdvancedSettings.bind(settingsController));

export default router;
