import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { authenticateUser, authorizeRoles } from '../../../middlewares/auth';

const router = Router();
const systemController = new SystemController();

// Protect all routes and restrict them to SUPER_ADMIN role
router.use(authenticateUser);
router.use(authorizeRoles(['SUPER_ADMIN']));

router.get('/analytics', systemController.getAnalytics.bind(systemController));
router.get('/logs/sms', systemController.getSmsLogs.bind(systemController));
router.get('/logs/payments', systemController.getPaymentLogs.bind(systemController));

export default router;
