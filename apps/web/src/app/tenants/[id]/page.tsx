'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, Palette, Globe, Mail, Users, Shield } from 'lucide-react';
import { MOCK_TENANTS } from '@/lib/mock-data';

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const tenant = MOCK_TENANTS.find((t) => t.id === tenantId);

  if (!tenant) {
    return (
      <DashboardLayout>
        <Header title="Tenant Not Found" />
        <div className="p-8">
          <p className="text-gray-500">No tenant found with ID: {tenantId}</p>
          <Link href="/tenants">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header
        title={tenant.name}
        description={`Tenant Configuration — ${tenant.slug}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/tenants">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </Link>
            <Button size="sm">Save Changes</Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                General Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div
                  className="mx-auto h-16 w-16 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: tenant.branding.primaryColor }}
                >
                  {tenant.branding.appName.charAt(0)}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{tenant.branding.appName}</h3>
                <p className="text-sm text-gray-500">{tenant.slug}</p>
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>{tenant.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <Badge>{tenant.plan}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Users</span>
                  <span className="font-medium">{formatNumber(tenant.userCount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{formatDate(tenant.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding Configuration */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-gray-400" />
                White-Label Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="App Name"
                  defaultValue={tenant.branding.appName}
                  id="appName"
                />
                <Input
                  label="Support Email"
                  defaultValue={tenant.branding.supportEmail}
                  id="supportEmail"
                  type="email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-gray-200"
                      style={{ backgroundColor: tenant.branding.primaryColor }}
                    />
                    <input
                      type="text"
                      defaultValue={tenant.branding.primaryColor}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-gray-200"
                      style={{ backgroundColor: tenant.branding.secondaryColor }}
                    />
                    <input
                      type="text"
                      defaultValue={tenant.branding.secondaryColor}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {tenant.branding.supportPhone && (
                <Input
                  label="Support Phone"
                  defaultValue={tenant.branding.supportPhone}
                  id="supportPhone"
                />
              )}

              {/* Brand Preview */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Preview</p>
                <div className="rounded-lg overflow-hidden">
                  <div
                    className="px-6 py-4 text-white"
                    style={{ backgroundColor: tenant.branding.primaryColor }}
                  >
                    <p className="font-bold text-lg">{tenant.branding.appName}</p>
                    <p className="text-sm opacity-80">Welcome to your financial dashboard</p>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <button
                      className="px-4 py-1.5 rounded text-sm text-white font-medium"
                      style={{ backgroundColor: tenant.branding.primaryColor }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Feature Toggles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tenant.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {feature.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {enabled ? 'Enabled for this tenant' : 'Not available on current plan'}
                    </p>
                  </div>
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
