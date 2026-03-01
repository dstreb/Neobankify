'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { formatNumber, formatDate } from '@/lib/utils';
import { Building2, Users, Plus, Settings } from 'lucide-react';
import { MOCK_TENANTS } from '@/lib/mock-data';

const statusVariant: Record<string, 'success' | 'warning' | 'info'> = {
  active: 'success',
  suspended: 'warning',
  provisioning: 'info',
};

const planVariant: Record<string, 'default' | 'info' | 'success'> = {
  starter: 'default',
  growth: 'info',
  enterprise: 'success',
};

export default function TenantsPage() {
  const activeTenants = MOCK_TENANTS.filter((t) => t.status === 'active').length;
  const totalUsers = MOCK_TENANTS.reduce((sum, t) => sum + t.userCount, 0);

  return (
    <DashboardLayout>
      <Header
        title="Tenants"
        description="Multi-tenant management and white-label configuration"
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Tenant
          </Button>
        }
      />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            title="Total Tenants"
            value={String(MOCK_TENANTS.length)}
            icon={<Building2 className="h-6 w-6" />}
          />
          <StatCard
            title="Active Tenants"
            value={String(activeTenants)}
            change={7.1}
            icon={<Settings className="h-6 w-6" />}
          />
          <StatCard
            title="Total Users (All Tenants)"
            value={formatNumber(totalUsers)}
            change={8.2}
            icon={<Users className="h-6 w-6" />}
          />
        </div>

        {/* Tenant Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_TENANTS.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Brand Header */}
              <div
                className="h-2"
                style={{ backgroundColor: tenant.branding.primaryColor }}
              />
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">{tenant.branding.appName} &middot; {tenant.slug}</p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tenant.branding.primaryColor }}
                  >
                    {tenant.branding.appName.charAt(0)}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={statusVariant[tenant.status]}>{tenant.status}</Badge>
                  <Badge variant={planVariant[tenant.plan]}>{tenant.plan}</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Users</span>
                    <span className="font-medium">{formatNumber(tenant.userCount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium">{formatDate(tenant.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Support</span>
                    <span className="font-medium text-brand-600">{tenant.branding.supportEmail}</span>
                  </div>
                </div>

                {/* Feature Flags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(tenant.features).map(([feature, enabled]) => (
                    <Badge key={feature} variant={enabled ? 'success' : 'default'}>
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/tenants/${tenant.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="mr-2 h-4 w-4" /> Configure
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
