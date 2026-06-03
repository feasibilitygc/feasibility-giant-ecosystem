import { Router } from 'express';
import { CooperativeController } from '../controllers/cooperative.controller';

const router = Router();
const controller = new CooperativeController();

// Public: list all cooperatives (for frontend dropdown selection)
router.get('/list', controller.list.bind(controller));

// Registration endpoint (public)
router.post('/register', controller.register.bind(controller));

// Dynamic theme and configuration fetching endpoint
router.get('/config', controller.getConfig.bind(controller));

export default router;
