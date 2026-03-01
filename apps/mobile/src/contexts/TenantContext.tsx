import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import * as storage from '../utils/storage';
import type { Tenant, BrandConfig, FeatureFlags } from '../types/models';
import { useTheme } from './ThemeContext';

// =====================================================
// Tenant Context - Multi-Tenant Configuration
// =====================================================

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  rewardsEnabled: true,
  idleCashEnabled: false,
  investingEnabled: false,
  tradingEnabled: false,
  lendingEnabled: false,
  cardManagementEnabled: true,
  accountAggregationEnabled: true,
};

const DEFAULT_BRAND_CONFIG: BrandConfig = {
  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
  accentColor: '#0f3460',
  logoUrl: '',
  appName: 'Neobank',
};

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  featureFlags: FeatureFlags;
  brandConfig: BrandConfig;
  setTenant: (tenant: Tenant) => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenantState] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { applyBrandColors } = useTheme();
  const applyBrandColorsRef = useRef(applyBrandColors);
  applyBrandColorsRef.current = applyBrandColors;

  useEffect(() => {
    async function loadTenant() {
      try {
        const tenantId = await storage.getTenantId();
        if (tenantId) {
          // In production, fetch tenant config from API
          // For now, use defaults
          const brandConfig = DEFAULT_BRAND_CONFIG;
          setTenantState({
            id: tenantId,
            name: 'Neobank',
            slug: 'neobank',
            brandConfig,
            featureFlags: DEFAULT_FEATURE_FLAGS,
          });
          applyBrandColorsRef.current({
            primary: brandConfig.primaryColor,
            secondary: brandConfig.secondaryColor,
            accent: brandConfig.accentColor,
          });
        }
      } catch {
        // Use defaults on error
      } finally {
        setIsLoading(false);
      }
    }
    loadTenant();
  }, []);

  const setTenant = useCallback(async (newTenant: Tenant) => {
    await storage.setTenantId(newTenant.id);
    setTenantState(newTenant);

    // Apply brand colors to theme
    if (newTenant.brandConfig) {
      applyBrandColors({
        primary: newTenant.brandConfig.primaryColor,
        secondary: newTenant.brandConfig.secondaryColor,
        accent: newTenant.brandConfig.accentColor,
      });
    }
  }, [applyBrandColors]);

  const featureFlags = tenant?.featureFlags || DEFAULT_FEATURE_FLAGS;
  const brandConfig = tenant?.brandConfig || DEFAULT_BRAND_CONFIG;

  const value = useMemo(
    () => ({ tenant, isLoading, featureFlags, brandConfig, setTenant }),
    [tenant, isLoading, featureFlags, brandConfig, setTenant],
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
