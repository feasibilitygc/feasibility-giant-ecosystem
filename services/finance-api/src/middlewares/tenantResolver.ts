import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma';
import { requestContextStore } from '../utils/contextStore';

const DEFAULT_COOPERATIVE_ID = '00000000-0000-0000-0000-000000000000';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function tenantResolver(req: Request, res: Response, next: NextFunction) {
  try {
    let cooperativeId: string | undefined = undefined;

    // 1. Resolve from X-Tenant-ID header
    const tenantHeader = req.headers['x-tenant-id'] || req.headers['X-Tenant-ID'];
    if (tenantHeader && typeof tenantHeader === 'string') {
      if (UUID_REGEX.test(tenantHeader)) {
        cooperativeId = tenantHeader;
      }
    }

    // 2. Fallback: Resolve from host header/subdomain
    if (!cooperativeId) {
      const host = req.headers.host;
      if (host) {
        const parts = host.split('.');
        // Extract subdomain if it's not a generic domain or localhost
        if (parts.length > 1 && !host.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
          const subdomain = parts[0];
          const ignoreSubdomains = ['www', 'app', 'api', 'admin', 'portal', 'localhost'];
          
          if (subdomain && !ignoreSubdomains.includes(subdomain)) {
            // Find cooperative by subdomain in database
            const coop = await prisma.cooperative.findUnique({
              where: { subdomain }
            });
            if (coop) {
              cooperativeId = coop.id;
            }
          }
        }
      }
    }

    // 3. Fallback: Use master/default cooperative if not resolved yet
    if (!cooperativeId) {
      cooperativeId = DEFAULT_COOPERATIVE_ID;
    }

    // Attach cooperativeId to the request context
    req.cooperativeId = cooperativeId;
    
    // Run the rest of the middlewares/routes in the AsyncLocalStorage context
    requestContextStore.run({ cooperativeId }, () => {
      next();
    });
  } catch (error) {
    console.error('[TenantResolver] Error resolving tenant:', error);
    // If an error occurs, fallback to default rather than blocking the application
    req.cooperativeId = DEFAULT_COOPERATIVE_ID;
    requestContextStore.run({ cooperativeId: DEFAULT_COOPERATIVE_ID }, () => {
      next();
    });
  }
}
