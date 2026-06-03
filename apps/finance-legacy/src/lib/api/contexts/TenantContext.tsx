'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { BASE_URL } from '@/lib/api/apiService';

export interface TenantTheme {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  custom_css?: string;
}

export interface TenantSettings {
  allow_self_registration: boolean;
  require_mfa: boolean;
  default_timezone?: string;
}

export interface TenantConfig {
  cooperative_id: string;
  name: string;
  subdomain: string;
  theme: TenantTheme;
  settings: TenantSettings;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
  isTenantResolved: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Fallback / default config (e.g. Master SaaS theme)
const DEFAULT_CONFIG: TenantConfig = {
  cooperative_id: '00000000-0000-0000-0000-000000000000',
  name: 'Feasibility Finance Master',
  subdomain: 'app',
  theme: {
    primary_color: '#1A4F8B', // Standard theme Primary Blue
    secondary_color: '#1FAF5A', // Standard theme Emerald Green
    logo_url: null,
  },
  settings: {
    allow_self_registration: true,
    require_mfa: false,
  },
};

// Simulated mock configurations for testing subdomains locally
const LOCAL_MOCK_CONFIGS: Record<string, Partial<TenantConfig>> = {
  'noble-savings': {
    cooperative_id: '8f9024c0-c3d3-4876-b072-0081d59663b4',
    name: 'Noble Multi-Purpose Cooperative',
    subdomain: 'noble-savings',
    theme: {
      primary_color: '#C9A227', // Accent Gold
      secondary_color: '#1A4F8B', // Primary Blue
      logo_url: 'https://cdn.feasibilityfinance.com/assets/logos/noble.png',
    },
    settings: {
      allow_self_registration: true,
      require_mfa: true,
    },
  },
  'giant-coop': {
    cooperative_id: '3f8024c0-c3d3-4876-b072-0081d59663b0',
    name: 'Giant Cooperative Society',
    subdomain: 'giant-coop',
    theme: {
      primary_color: '#1FAF5A', // Emerald Green
      secondary_color: '#C9A227', // Accent Gold
      logo_url: null,
    },
    settings: {
      allow_self_registration: false, // Disallow self-registration for this tenant
      require_mfa: false,
    },
  },
};

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveTenant() {
      if (typeof window === 'undefined') return;

      try {
        const hostname = window.location.hostname;
        let subdomain = '';

        // Resolve subdomain (e.g. noble-savings.feasibilityfinance.com or noble-savings.localhost)
        const parts = hostname.split('.');
        if (parts.length > 1 && !hostname.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
          // If localhost or custom domain, extract subdomain
          if (parts[parts.length - 1] === 'localhost' || hostname.includes('feasibilityfinance.com')) {
            subdomain = parts[0];
          }
        }

        // Avoid resolving common generic domains/subdomains as custom tenants
        const ignoreSubdomains = ['www', 'app', 'api', 'admin', 'portal', 'localhost'];
        if (subdomain && !ignoreSubdomains.includes(subdomain)) {
          console.log(`[TenantResolver] Detected tenant subdomain: ${subdomain}`);
          
          // Check local mock first to ease local testing/preview
          if (LOCAL_MOCK_CONFIGS[subdomain]) {
            const mockConfig = {
              ...DEFAULT_CONFIG,
              ...LOCAL_MOCK_CONFIGS[subdomain],
              subdomain,
            } as TenantConfig;
            
            setTenant(mockConfig);
            localStorage.setItem('cooperative_id', mockConfig.cooperative_id);
            setLoading(false);
            return;
          }

          // Fetch active tenant configuration from API
          try {
            const response = await axios.get(`${BASE_URL}/cooperatives/config`, {
              headers: { 'X-Tenant-Host': hostname }
            });
            
            if (response.data && response.data.cooperative_id) {
              setTenant(response.data);
              localStorage.setItem('cooperative_id', response.data.cooperative_id);
            } else {
              throw new Error('Invalid config structure');
            }
          } catch (apiErr) {
            console.warn(`[TenantResolver] Failed to fetch remote config, using default branding.`, apiErr);
            // Fallback to default but set the resolved subdomain name
            const fallbackConfig = { ...DEFAULT_CONFIG, name: `${subdomain.toUpperCase()} Cooperative`, subdomain };
            setTenant(fallbackConfig);
            localStorage.setItem('cooperative_id', fallbackConfig.cooperative_id);
          }
        } else {
          // Generic / root domain access
          console.log('[TenantResolver] Root domain accessed. Loading master config.');
          setTenant(DEFAULT_CONFIG);
          localStorage.setItem('cooperative_id', DEFAULT_CONFIG.cooperative_id);
        }
      } catch (err) {
        console.error('[TenantResolver] Error resolving tenant context:', err);
        setError('Failed to resolve cooperative configuration.');
        setTenant(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    }

    resolveTenant();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        isTenantResolved: tenant !== null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
