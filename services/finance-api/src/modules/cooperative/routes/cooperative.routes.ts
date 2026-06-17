import { Router } from 'express';
import { CooperativeController } from '../controllers/cooperative.controller';
import { authenticateUser } from '../../../middlewares/auth';

const router = Router();
const controller = new CooperativeController();

// Public: list all cooperatives (for frontend dropdown selection)
router.get('/list', controller.list.bind(controller));

// Registration endpoint (public)
router.post('/register', controller.register.bind(controller));

// Dynamic theme and configuration fetching endpoint
router.get('/config', controller.getConfig.bind(controller));

// Setup sub-account endpoint (requires auth)
router.post('/setup-subaccount', authenticateUser, controller.setupSubaccount.bind(controller));

export default router;
