import { Router } from 'express';
import { WebhookController } from '../modules/transaction/controllers/webhook.controller';

const router = Router();
const controller = new WebhookController();

// POST endpoint for incoming webhooks (public, authentication handled via signature checks inside the controller)
router.post('/', controller.handleWebhook.bind(controller));

export default router;
