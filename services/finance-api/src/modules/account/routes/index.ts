import { Router } from 'express'
import accountRoutes from './account.routes'
import bankRoutes from './bank.routes'

const router = Router();

router.use('/banks', bankRoutes)
router.use('/', accountRoutes)

export default router;