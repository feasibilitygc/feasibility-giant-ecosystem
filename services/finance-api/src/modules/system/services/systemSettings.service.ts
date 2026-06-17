import { prisma, PrismaClient, Prisma } from '@/prisma';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';

export class SystemSettingsService {
    private static instance: SystemSettingsService;
    private prisma: PrismaClient;
    private systemUserId: string;

    private constructor() {  // Make constructor private
        this.prisma = prisma;
        this.systemUserId = '';
    }

    static getInstance(): SystemSettingsService {
        if (!SystemSettingsService.instance) {
            SystemSettingsService.instance = new SystemSettingsService();
            // Initialize settings when instance is created
            this.instance.initializeDefaultSettings().catch(error => {
                logger.error('Failed to initialize system settings:', error);
            });
        }
        return SystemSettingsService.instance;
    }

    async ensureSystemUser(): Promise<string> {
        try {
            // Try to find existing system user
            const systemUser = await this.prisma.user.findFirst({
                where: {
                    username: 'SYSTEM',
                    isMember: false
                }
            });

            if (systemUser) {
                return systemUser.id;
            }

            // Create system user if it doesn't exist
            const newSystemUser = await this.prisma.user.create({
                data: {
                    username: 'SYSTEM',
                    isMember: false,
                    isActive: true,
                    password: null, // System user cannot login
                    roleAssignments: {
                        create: {
                            role: {
                                create: {
                                    name: 'SYSTEM',
                                    description: 'System Operations',
                                    permissions: ['SYSTEM_OPERATIONS'],
                                    approvalLevel: 0,
                                    canApprove: false,
                                    moduleAccess: ['SYSTEM']
                                }
                            }
                        }
                    }
                }
            });

            return newSystemUser.id;
        } catch (error) {
            logger.error('Error ensuring system user:', error);
            throw new ApiError('Failed to initialize system user', 500);
        }
    }

    async initializeDefaultSettings(): Promise<void> {
        try {
            // Ensure system user exists
            const systemUserId = await this.ensureSystemUser();

            // Helper to check and create default setting
            const ensureSetting = async (
                key: string,
                value: any,
                type: string,
                group: string,
                description: string
            ) => {
                const existing = await this.prisma.systemSettings.findUnique({
                    where: { key }
                });
                if (!existing) {
                    await this.prisma.systemSettings.create({
                        data: {
                            key,
                            value: JSON.stringify(value),
                            type,
                            group,
                            description,
                            createdBy: systemUserId
                        }
                    });
                    logger.info(`Initialized ${key} setting`);
                }
            };

            await ensureSetting('DEFAULT_SHARE_AMOUNT', 3000, 'number', 'SHARES', 'Default monthly share amount');
            
            await ensureSetting('GENERAL_SETTINGS', {
                organizationName: 'Cooperative Banking System',
                organizationShortName: 'CoopBank',
                contactEmail: 'admin@coopbank.com',
                contactPhone: '+2348000000000',
                address: '123 Main Street, Lagos, Nigeria',
                logoUrl: '',
                websiteUrl: '',
                enableMemberRegistration: true,
                enablePublicWebsite: true
            }, 'object', 'GENERAL', 'General system-wide settings');

            await ensureSetting('SECURITY_SETTINGS', {
                passwordMinLength: 8,
                passwordRequiresLowercase: true,
                passwordRequiresUppercase: true,
                passwordRequiresNumbers: true,
                passwordRequiresSymbols: true,
                mfaEnabled: false,
                sessionTimeout: 30,
                sessionTimeoutUnit: 'minutes',
                loginAttempts: 5,
                lockoutDuration: 15
            }, 'object', 'SECURITY', 'Security policies and settings');

            await ensureSetting('NOTIFICATION_SETTINGS', {
                enableEmailNotifications: true,
                enableSmsNotifications: true,
                enablePushNotifications: true,
                notifyOnNewMembers: true,
                notifyOnLoanRequests: true,
                notifyOnLoanApprovals: true,
                notifyOnDepositConfirmations: true,
                dailyDigest: false,
                weeklyReport: false,
                monthlyStatement: true
            }, 'object', 'NOTIFICATION', 'Notification preferences and settings');

            await ensureSetting('ADVANCED_SETTINGS', {
                maintenanceMode: false,
                debugMode: false,
                logLevel: 'info',
                apiTimeout: 30000,
                cacheExpiration: 3600,
                maxUploadSize: 5,
                backupFrequency: 'daily',
                allowDataExport: true,
                enableApiLogs: true
            }, 'object', 'ADVANCED', 'Advanced developer/system settings');

        } catch (error) {
            logger.error('Error initializing system settings:', error);
            throw new ApiError('Failed to initialize system settings', 500);
        }
    }

    async getSetting<T>(key: string): Promise<T> {
        try {
            const setting = await this.prisma.systemSettings.findUnique({
                where: { key }
            });

            if (!setting) {
                // Initialize settings if not found
                await this.initializeDefaultSettings();
                // Try to get the setting again
                const initializedSetting = await this.prisma.systemSettings.findUnique({
                    where: { key }
                });
                
                if (!initializedSetting) {
                    throw new ApiError(`Setting ${key} not found`, 404);
                }
                
                return JSON.parse(initializedSetting.value) as T;
            }

            return JSON.parse(setting.value) as T;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error getting system setting:', error);
            throw new ApiError('Failed to get system setting', 500);
        }
    }

    async updateSetting(
        key: string, 
        value: any, 
        userId: string, 
        reason: string
    ) {
        try {
            const oldSetting = await this.prisma.systemSettings.findUnique({
                where: { key }
            });

            return await this.prisma.$transaction(async (tx: any) => {
                const setting = await tx.systemSettings.upsert({
                    where: { key },
                    create: {
                        key,
                        value: JSON.stringify(value),
                        type: typeof value,
                        group: 'SHARES',
                        description: 'Default monthly share amount',
                        createdBy: userId
                    },
                    update: {
                        value: JSON.stringify(value),
                        updatedAt: new Date()
                    }
                });

                if (oldSetting) {
                    await tx.systemSettingsHistory.create({
                        data: {
                            settingId: setting.id,
                            oldValue: oldSetting.value,
                            newValue: JSON.stringify(value),
                            updatedBy: userId,
                            reason
                        }
                    });
                }

                return setting;
            });
        } catch (error) {
            logger.error('Error updating system setting:', error);
            throw new ApiError('Failed to update system setting', 500);
        }
    }
}