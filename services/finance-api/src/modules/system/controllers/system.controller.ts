import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma';
import { ApiResponse } from '../../../utils/apiResponse';
import { runWithoutIsolation } from '../../../utils/contextStore';

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
}

export class SystemController {
  
  // GET /system/analytics
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await runWithoutIsolation(async () => {
        // 1. Cooperative statistics
        const cooperativesCount = await prisma.cooperative.count();
        const cooperatives = await prisma.cooperative.findMany({
          include: {
            _count: {
              select: {
                users: true,
                biodata: true,
                transactions: true,
              }
            }
          }
        });

        // 2. Global member statistics
        const membersCount = await prisma.biodata.count();

        // 3. Loan statistics
        const activeLoansCount = await prisma.loan.count({
          where: {
            status: {
              in: ['ACTIVE', 'DISBURSED']
            }
          }
        });

        const loanDisbursementSum = await prisma.loan.aggregate({
          where: {
            status: {
              in: ['ACTIVE', 'DISBURSED', 'COMPLETED']
            }
          },
          _sum: {
            principalAmount: true
          }
        });

        const totalLoansDisbursed = Number(loanDisbursementSum._sum.principalAmount) || 0;

        // 4. Repayments statistics
        const repaymentSum = await prisma.loanRepayment.aggregate({
          _sum: {
            amount: true
          }
        });
        const totalRepayments = Number(repaymentSum._sum.amount) || 0;

        // 5. Compute programmatic SaaS split earnings
        // We sum CREDITS per cooperative and multiply by their splitPercent
        let totalSaaSSplitEarnings = 0;
        const coopContributions: Array<{ id: string; name: string; splitPercent: number; contribution: number }> = [];

        for (const coop of cooperatives) {
          const split = Number(coop.splitPercent) || 0;
          let coopCreditSum = 0;

          if (split > 0) {
            const sumAggregate = await prisma.transaction.aggregate({
              where: {
                cooperativeId: coop.id,
                status: 'COMPLETED',
                transactionType: 'CREDIT'
              },
              _sum: {
                amount: true
              }
            });
            coopCreditSum = Number(sumAggregate._sum.amount) || 0;
          }

          const contribution = (coopCreditSum * split) / 100;
          totalSaaSSplitEarnings += contribution;

          coopContributions.push({
            id: coop.id,
            name: coop.name,
            splitPercent: split,
            contribution
          });
        }

        // 6. SMS dispatch statistics
        const totalSms = await prisma.smsLog.count();
        const sentSms = await prisma.smsLog.count({
          where: {
            messageStatus: 'SENT'
          }
        });
        const failedSms = await prisma.smsLog.count({
          where: {
            messageStatus: 'FAILED'
          }
        });

        const smsByProviderRaw = await prisma.smsLog.groupBy({
          by: ['provider'],
          _count: {
            id: true
          }
        });

        const smsByProvider = smsByProviderRaw.map(p => ({
          provider: p.provider,
          count: p._count.id
        }));

        // 7. Assemble dashboard payload
        return {
          overview: {
            cooperativesCount,
            membersCount,
            activeLoansCount,
            totalLoansDisbursed,
            totalRepayments,
            totalSaaSSplitEarnings
          },
          smsStats: {
            totalSms,
            sentSms,
            failedSms,
            byProvider: smsByProvider
          },
          cooperatives: cooperatives.map(coop => {
            const contribution = coopContributions.find(c => c.id === coop.id)?.contribution || 0;
            return {
              id: coop.id,
              name: coop.name,
              subdomain: coop.subdomain,
              customDomain: coop.customDomain,
              cacNumber: coop.cacNumber,
              splitPercent: Number(coop.splitPercent) || 0,
              usersCount: coop._count.users,
              membersCount: coop._count.biodata,
              transactionsCount: coop._count.transactions,
              splitEarningsContribution: contribution,
              createdAt: coop.createdAt
            };
          })
        };
      });

      return ApiResponse.success(res, 'System dashboard analytics retrieved', analytics);
    } catch (error) {
      next(error);
    }
  }

  // GET /system/logs/sms
  async getSmsLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recipient, provider, status, cooperativeId, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (recipient) {
        where.recipient = {
          contains: String(recipient)
        };
      }
      if (provider) {
        where.provider = String(provider);
      }
      if (status) {
        where.messageStatus = String(status);
      }
      if (cooperativeId) {
        where.cooperativeId = String(cooperativeId);
      }

      const result = await runWithoutIsolation(async () => {
        const logs = await prisma.smsLog.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc'
          }
        });

        const total = await prisma.smsLog.count({ where });

        // Retrieve cooperative names for better display
        const logsWithCoop = await Promise.all(logs.map(async (log) => {
          let cooperativeName = 'Global/System';
          if (log.cooperativeId) {
            const coop = await prisma.cooperative.findUnique({
              where: { id: log.cooperativeId },
              select: { name: true }
            });
            if (coop) {
              cooperativeName = coop.name;
            }
          }
          return {
            ...log,
            cooperativeName
          };
        }));

        return {
          logs: logsWithCoop,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        };
      });

      return ApiResponse.success(res, 'SMS logs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  // GET /system/logs/payments
  async getPaymentLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { transactionType, status, cooperativeId, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (transactionType) {
        where.transactionType = String(transactionType);
      }
      if (status) {
        where.status = String(status);
      }
      if (cooperativeId) {
        where.cooperativeId = String(cooperativeId);
      }

      const result = await runWithoutIsolation(async () => {
        const transactions = await prisma.transaction.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            cooperative: {
              select: {
                name: true,
                splitPercent: true
              }
            },
            initiator: {
              select: {
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const total = await prisma.transaction.count({ where });

        // Format transactions to include split details
        const formattedTxns = transactions.map(txn => {
          const splitPercent = txn.cooperative ? Number(txn.cooperative.splitPercent) : 0;
          const amount = Number(txn.amount) || 0;
          const splitAmount = (amount * splitPercent) / 100;
          const cooperativeAmount = amount - splitAmount;

          return {
            id: txn.id,
            transactionType: txn.transactionType,
            baseType: txn.baseType,
            module: txn.module,
            amount,
            balanceAfter: Number(txn.balanceAfter) || 0,
            status: txn.status,
            description: txn.description,
            cooperativeId: txn.cooperativeId,
            cooperativeName: txn.cooperative?.name || 'Global/System',
            initiatedBy: txn.initiator?.username || 'System',
            splitPercent,
            saasSplitAmount: splitAmount,
            cooperativeAmount,
            createdAt: txn.createdAt,
            completedAt: txn.completedAt
          };
        });

        return {
          payments: formattedTxns,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        };
      });

      return ApiResponse.success(res, 'Payment logs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
