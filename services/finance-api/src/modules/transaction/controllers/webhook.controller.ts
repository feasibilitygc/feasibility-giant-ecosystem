import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma, TransactionType, TransactionStatus, TransactionModule } from '@/prisma';
import { TransactionService } from '../services/transaction.service';
import logger from '../../../utils/logger';
import { Decimal } from 'decimal.js';

const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';
const FLW_WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH || 'feasibility-flw-secret';

export class WebhookController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const monnifySignature = req.headers['monnify-signature'] as string;
      const flwSignature = req.headers['verif-hash'] as string;
      const monoSignature = req.headers['mono-webhook-secret'] as string;

      logger.info('Received webhook request.');

      // 1. Signature Verification
      let isVerified = false;
      const bypassSignature = process.env.BYPASS_WEBHOOK_SIGNATURE_FOR_TESTING === 'true' || process.env.NODE_ENV === 'development';

      if (bypassSignature) {
        logger.warn('⚠️ Webhook signature verification is bypassed (Sandbox/Dev mode)');
        isVerified = true;
      } else {
        if (monnifySignature) {
          const computedSignature = crypto
            .createHmac('sha512', MONNIFY_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');
          
          if (monnifySignature === computedSignature) {
            isVerified = true;
            logger.info('✅ Monnify signature verified successfully');
          } else {
            logger.warn('❌ Monnify signature verification failed');
          }
        } else if (flwSignature) {
          if (flwSignature === FLW_WEBHOOK_HASH) {
            isVerified = true;
            logger.info('✅ Flutterwave signature verified successfully');
          } else {
            logger.warn('❌ Flutterwave signature verification failed');
          }
        } else if (monoSignature) {
          const monoSecret = process.env.MONO_WEBHOOK_SEC || '';
          if (monoSignature === monoSecret) {
            isVerified = true;
            logger.info('✅ Mono signature verified successfully');
          } else {
            logger.warn('❌ Mono signature verification failed');
          }
        }
      }

      if (!isVerified) {
        logger.error('Unauthorized Webhook access: Signature mismatch');
        return res.status(401).json({ status: 'error', message: 'Unauthorized webhook request' });
      }

      // 2. Event Routing
      const body = req.body;
      
      const isMonoWebhook = !!monoSignature || (body.event && (body.event.includes('mandate') || body.event.includes('direct_debit')));

      if (isMonoWebhook) {
        const event = body.event;
        logger.info(`Processing Mono Webhook event: ${event}`);

        if (event && event.startsWith('events.mandates.')) {
          const data = body.data || {};
          const reference = data.reference;
          const monoMandateId = data.id;

          const mandate = await prisma.directDebitMandate.findFirst({
            where: {
              OR: [
                { reference },
                { monoMandateId }
              ]
            }
          });

          if (!mandate) {
            logger.error(`Could not find DirectDebitMandate for reference: ${reference} or mandateId: ${monoMandateId}`);
            return res.status(404).json({ status: 'error', message: 'Mandate not found' });
          }

          const cooperativeId = mandate.cooperativeId;
          if (!cooperativeId) {
            logger.error(`Mandate ${mandate.id} has no cooperativeId associated`);
            return res.status(400).json({ status: 'error', message: 'Cooperative context missing' });
          }

          const { requestContextStore } = await import('../../../utils/contextStore');
          return await requestContextStore.run({ cooperativeId }, async () => {
            let status = 'PENDING';
            if (event === 'events.mandates.approved' || event === 'events.mandates.ready-to-debit') {
              status = 'ACTIVE';
            } else if (event === 'events.mandates.rejected') {
              status = 'REJECTED';
            } else if (event === 'events.mandates.cancelled') {
              status = 'CANCELLED';
            }

            await prisma.directDebitMandate.update({
              where: { id: mandate.id },
              data: { status }
            });

            logger.info(`✅ Updated Mono Mandate ${mandate.id} status to ${status}`);
            return res.status(200).json({ status: 'success', message: `Mandate updated to ${status}` });
          });
        }

        if (event === 'direct_debit.payment_successful' || event === 'events.direct_debit.payment_successful' || (event && event.includes('payment_successful'))) {
          const data = body.data || {};
          const reference = data.reference;
          const amountKobo = data.amount;
          const amount = amountKobo / 100;

          const transactions = await prisma.transaction.findMany({
            where: {
              transactionType: 'LOAN_REPAYMENT',
              status: 'PENDING'
            }
          });

          const pendingTx = transactions.find((t: any) => {
            const meta = t.metadata as any;
            return meta && meta.sweepReference === reference;
          });

          if (!pendingTx) {
            logger.error(`Could not resolve pending LOAN_REPAYMENT transaction for sweep reference: ${reference}`);
            return res.status(404).json({ status: 'error', message: 'Pending transaction not found' });
          }

          const loan = await prisma.loan.findUnique({
            where: { id: pendingTx.loanId }
          });

          if (!loan) {
            logger.error(`Loan not found for transaction: ${pendingTx.id}`);
            return res.status(404).json({ status: 'error', message: 'Loan not found' });
          }

          const cooperativeId = loan.cooperativeId;
          if (!cooperativeId) {
            logger.error(`Loan ${loan.id} has no cooperativeId associated`);
            return res.status(400).json({ status: 'error', message: 'Cooperative context missing' });
          }

          const { requestContextStore } = await import('../../../utils/contextStore');
          return await requestContextStore.run({ cooperativeId }, async () => {
            const updatedTx = await this.transactionService.updateTransactionStatus(
              pendingTx.id,
              'COMPLETED',
              pendingTx.initiatedBy || 'SYSTEM',
              `Completed via Mono Direct Debit sweep (Ref: ${reference})`
            );

            logger.info(`✅ Successfully cleared Mono direct debit repayment transaction ${updatedTx.id} for loan ${loan.id}`);
            return res.status(200).json({
              status: 'success',
              message: 'Mono payment sweep cleared successfully',
              data: {
                transactionId: updatedTx.id,
                reference
              }
            });
          });
        }

        logger.info(`Acknowledge other Mono event: ${event}`);
        return res.status(200).json({ status: 'success', message: 'Event acknowledged' });
      }

      let eventType = '';
      let amount = 0;
      let transactionReference = '';
      let subaccountCode = '';
      let customerEmail = '';
      let metaData: any = {};

      if (monnifySignature || body.eventType) {
        // Monnify Webhook
        eventType = body.eventType;
        if (eventType === 'SUCCESSFUL_TRANSACTION') {
          const eventData = body.eventData;
          amount = eventData.amountPaid || eventData.settlementAmount;
          transactionReference = eventData.transactionReference;
          subaccountCode = eventData.destinationAccountPaymentInformation?.subAccountCode || '';
          customerEmail = eventData.customer?.email || '';
          metaData = eventData.metaData || {};
        } else {
          logger.info(`Monnify webhook received event: ${eventType}. Acknowledging without processing.`);
          return res.status(200).json({ status: 'success', message: 'Event acknowledged' });
        }
      } else if (flwSignature || body.event) {
        // Flutterwave Webhook
        eventType = body.event;
        if (eventType === 'charge.completed') {
          const data = body.data;
          amount = data.amount;
          transactionReference = data.tx_ref || data.flw_ref;
          subaccountCode = data.subaccount_id || '';
          customerEmail = data.customer?.email || '';
          metaData = data.meta || data.metadata || {};
        } else {
          logger.info(`Flutterwave webhook received event: ${eventType}. Acknowledging without processing.`);
          return res.status(200).json({ status: 'success', message: 'Event acknowledged' });
        }
      } else {
        // Unknown provider webhook
        logger.warn('Unknown webhook format received');
        return res.status(400).json({ status: 'error', message: 'Unknown webhook format' });
      }

      logger.info(`Processing payment: ref=${transactionReference}, amount=${amount}, subaccount=${subaccountCode}, email=${customerEmail}`);

      // 3. Resolve Cooperative Tenant
      let cooperative: any = null;
      if (subaccountCode) {
        cooperative = await prisma.cooperative.findFirst({
          where: { subaccountCode }
        });
      }

      if (!cooperative && metaData.cooperativeId) {
        cooperative = await prisma.cooperative.findUnique({
          where: { id: metaData.cooperativeId }
        });
      }

      if (!cooperative) {
        logger.error(`Could not resolve cooperative for subaccountCode: ${subaccountCode} or coopId: ${metaData.cooperativeId}`);
        return res.status(400).json({ status: 'error', message: 'Cooperative tenant context could not be resolved' });
      }

      logger.info(`Resolved cooperative: "${cooperative.name}" (ID: ${cooperative.id})`);

      const { requestContextStore } = await import('../../../utils/contextStore');

      return await requestContextStore.run({ cooperativeId: cooperative.id }, async () => {
        // 4. Resolve Member / Biodata
        let biodata: any = null;
        if (metaData.memberId) {
          biodata = await prisma.biodata.findFirst({
            where: { id: metaData.memberId }
          });
        }

        if (!biodata && customerEmail) {
          biodata = await prisma.biodata.findFirst({
            where: { emailAddress: customerEmail }
          });
        }

        if (!biodata) {
          logger.error(`Could not resolve member biodata for email: ${customerEmail} or memberId: ${metaData.memberId}`);
          return res.status(400).json({ status: 'error', message: 'Member could not be resolved' });
        }

        logger.info(`Resolved member: "${biodata.fullName}" (Staff No: ${biodata.staffNo})`);

        // 5. Look up or create savings account for member if savings transaction
        let relatedEntityId = metaData.savingsId || metaData.loanId || metaData.personalSavingsId || null;
        let relatedEntityType = 'SAVINGS';
        let targetTxnType: TransactionType = TransactionType.SAVINGS_DEPOSIT;

        if (metaData.transactionType === 'LOAN_REPAYMENT' || metaData.loanId) {
          relatedEntityType = 'LOAN';
          targetTxnType = TransactionType.LOAN_REPAYMENT;
        } else if (metaData.transactionType === 'PERSONAL_SAVINGS_DEPOSIT' || metaData.personalSavingsId) {
          relatedEntityType = 'PERSONAL_SAVINGS';
          targetTxnType = TransactionType.PERSONAL_SAVINGS_DEPOSIT;
        }

        if (relatedEntityType === 'SAVINGS') {
          let savings: any = null;
          if (relatedEntityId) {
            savings = await prisma.savings.findUnique({
              where: { id: relatedEntityId }
            });
          } else {
            // Find active savings for current month/year
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            savings = await prisma.savings.findFirst({
              where: { memberId: biodata.id, month: currentMonth, year: currentYear }
            });

            if (!savings) {
              // Check any savings record
              savings = await prisma.savings.findFirst({
                where: { memberId: biodata.id }
              });
            }
          }

          if (!savings) {
            logger.info(`No savings account found for member ${biodata.fullName}. Initializing new savings account.`);
            savings = await prisma.savings.create({
              data: {
                memberId: biodata.id,
                erpId: biodata.erpId,
                balance: new Decimal(0),
                monthlyTarget: new Decimal(1000.00),
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                cooperativeId: cooperative.id
              }
            });
          }
          relatedEntityId = savings.id;
        }

        // 6. Find initiator User ID (fall back to tenant admin)
        const memberUser = await prisma.user.findFirst({
          where: { biodataId: biodata.id }
        });

        let initiatorId = memberUser?.id;
        if (!initiatorId) {
          const tenantAdmin = await prisma.user.findFirst({
            where: { cooperativeId: cooperative.id, isMember: false }
          });
          initiatorId = tenantAdmin?.id;
        }

        if (!initiatorId) {
          logger.error(`Could not resolve any initiator user for cooperative ID ${cooperative.id}`);
          return res.status(400).json({ status: 'error', message: 'Could not resolve transaction initiator user context' });
        }

        // 7. Calculate SaaS Split Fee
        const splitPercent = Number(cooperative.splitPercent || 0);
        const platformFee = new Decimal(amount).times(splitPercent / 100);
        const coopSettlement = new Decimal(amount).minus(platformFee);

        logger.info(`SaaS Split calculation: Total=${amount} NGN, SaaS Split (${splitPercent}%)=${platformFee} NGN, Coop Settlement=${coopSettlement} NGN`);

        // 8. Execute transactions in database
        // Execute the deposit credit transaction (marked as completed and automatically processed)
        const mainTx = await this.transactionService.createTransaction({
          transactionType: targetTxnType,
          module: relatedEntityType === 'LOAN' ? TransactionModule.LOAN : TransactionModule.SAVINGS,
          amount: amount,
          initiatedBy: initiatorId,
          relatedEntityId: relatedEntityId,
          relatedEntityType: relatedEntityType,
          description: `External deposit credit of ${amount} NGN via payment provider (Ref: ${transactionReference})`,
          metadata: {
            webhookPayload: body,
            settlementDetails: {
              totalAmount: amount,
              platformSaaSFee: platformFee.toString(),
              cooperativeShare: coopSettlement.toString(),
              splitPercent
            }
          }
        }, true);

        // If there is a platform fee split, record the FEE transaction
        if (platformFee.greaterThan(0)) {
          await this.transactionService.createTransaction({
            transactionType: TransactionType.FEE,
            module: TransactionModule.SYSTEM,
            amount: Number(platformFee.toString()),
            initiatedBy: initiatorId,
            parentTxnId: mainTx.id,
            description: `Platform SaaS split fee (${splitPercent}%) for transaction ${mainTx.id}`,
            metadata: {
              feeType: 'PLATFORM_SAAS_SPLIT',
              parentTransactionId: mainTx.id,
              cooperativeId: cooperative.id
            }
          }, true);
          logger.info(`✅ Recorded platform SaaS fee split of ${platformFee} NGN`);
        }

        return res.status(200).json({
          status: 'success',
          message: 'Webhook processed successfully',
          data: {
            transactionId: mainTx.id,
            reference: transactionReference
          }
        });
      });
    } catch (error: any) {
      logger.error('Error processing webhook:', error);
      next(error);
    }
  }
}
