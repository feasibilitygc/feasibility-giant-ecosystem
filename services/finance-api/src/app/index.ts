import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from '../routes';
import { prisma } from '@/prisma';
import { Decimal } from '@/utils/prisma';
import logger from '../utils/logger';
import { errorHandler } from '../middlewares/errorHandler';
import { securityHeaders } from '../middlewares/rateLimiter';
import { requestLogger, requestContextMiddleware } from '../middlewares/request.middleware';
import swaggerDocs from '../docs/swaggerDocs';
import { PermissionSyncService } from '../utils/permissionSync';
import { SystemSettingsService } from '../modules/system/services/systemSettings.service';
import { authenticateUser } from '../middlewares/auth';
import { generateCsrfToken, validateCsrfToken } from '../middlewares/csrf';
import { authRateLimiter } from '../middlewares/rateLimit';
import { healthService } from '../services/health.service';
import { tenantResolver } from '../middlewares/tenantResolver';


const app = express();
// Use the singleton prisma instance
const permissionSync = new PermissionSyncService(prisma);

// Middleware setup
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        
        // Allow localhost development origins (including subdomains and ports)
        if (origin.match(/^https?:\/\/localhost(:\d+)?$/) || origin.match(/^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/)) {
            callback(null, true);
            return;
        }
        
        // Allow feasibilityfinance.com origins
        if (origin.match(/^https?:\/\/(?:[a-z0-9-]+\.)?feasibilityfinance\.com$/)) {
            callback(null, true);
            return;
        }
        
        // Check custom configured origins
        const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://fuosmcsl.online',
            'http://168.231.116.82:3000',
        ];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityHeaders);
app.use(requestLogger);
app.use(requestContextMiddleware);
app.use(tenantResolver);

// Initialize application
const initializeApp = async (): Promise<void> => {
    try {
        // Sync permissions before starting the app
        await permissionSync.syncPermissions();
        
        // Initialize system settings with singleton
        const systemSettings = SystemSettingsService.getInstance();
        await systemSettings.initializeDefaultSettings();
        
        // Verify DEFAULT_SHARE_AMOUNT was created
        const shareAmount = await systemSettings.getSetting<Decimal>('DEFAULT_SHARE_AMOUNT');
        logger.info('System settings initialized successfully', { shareAmount });
        
        // Health check endpoint
        app.get('/api/health', async (_req, res) => {
            const health = await healthService.checkHealth();
            const statusCode = health.status === 'healthy' ? 200 : 
            health.status === 'degraded' ? 200 : 503;
            
            res.status(statusCode).json(health);
        });
        
        // API routes
        app.use('/api', routes);
        
        // Swagger documentation
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
            swaggerOptions: {
                persistAuthorization: true
            }
        }));
        
        // Apply rate limiting to auth routes
        // Commented out during development as requested
        // app.use('/api/auth', authRateLimiter);
        
        // Apply authentication middleware to protected routes
        app.use('/api/protected', authenticateUser);
        
        // Generate CSRF token for authenticated users
        app.use(generateCsrfToken);
        
        // Validate CSRF token for mutating operations
        app.use('/api/protected', validateCsrfToken);
        
        // Error handling
        app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction): void => {
            errorHandler(err, req, res, next);
        });
        
        logger.info('Application initialized successfully');
    } catch (error) {
        logger.error('Application initialization failed:', error);
        throw error;
    }
};

// Call initializeApp immediately
initializeApp().catch(error => {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export default app;
