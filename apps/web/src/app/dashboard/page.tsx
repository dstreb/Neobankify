'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChartCard } from '@/components/charts/area-chart';
import { DonutChartCard } from '@/components/charts/donut-chart';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  Users,
  ArrowLeftRight,
  DollarSign,
  Gift,
  ShieldAlert,
  Building2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  MOCK_STATS,
  MOCK_REVENUE_CHART,
  MOCK_CATEGORY_CHART,
  MOCK_COMPLIANCE_ALERTS,
  MOCK_RECOMMENDATIONS,
} from '@/lib/mock-data';

const severityVariant: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const outcomeVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  recommended: 'info',
  accepted: 'success',
  executed: 'success',
  dismissed: 'default',
};

export default function DashboardPage() {
  const stats = MOCK_STATS;

  return (
    <DashboardLayout>
      <Header title="Dashboard" description="Platform overview and key metrics" />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={formatNumber(stats.totalUsers)}
            change={8.2}
            changeLabel="vs last month"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Transaction Volume"
            value={formatCurrency(stats.transactionVolume)}
            change={12.5}
            changeLabel="vs last month"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Rewards Earned"
            value={formatNumber(stats.totalRewardsEarned)}
            change={15.3}
            changeLabel="vs last month"
            icon={<Gift className="h-6 w-6" />}
          />
          <StatCard
            title="AI Decisions"
            value={formatNumber(stats.aiDecisions)}
            change={22.1}
            changeLabel="vs last month"
            icon={<Sparkles className="h-6 w-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction Volume</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-gray-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-500">Processed</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChartCard
                data={MOCK_REVENUE_CHART}
                dataKey="value"
                dataKey2="value2"
                formatValue={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChartCard data={MOCK_CATEGORY_CHART} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Transactions"
              value={formatNumber(stats.totalTransactions)}
              change={5.4}
              icon={<ArrowLeftRight className="h-5 w-5" />}
            />
            <StatCard
              title="Active Tenants"
              value={formatNumber(stats.tenantCount)}
              change={7.1}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              title="Active Users"
              value={formatNumber(stats.activeUsers)}
              change={3.8}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Open Alerts"
              value={String(stats.complianceAlerts)}
              change={-14.2}
              icon={<ShieldAlert className="h-5 w-5" />}
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compliance Alerts */}
              {MOCK_COMPLIANCE_ALERTS.filter((a) => a.status === 'open')
                .slice(0, 3)
                .map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{alert.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                        <span className="text-xs text-gray-400">{formatRelativeTime(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}

              {/* AI Recommendations */}
              {MOCK_RECOMMENDATIONS.slice(0, 2).map((rec) => (
                <div key={rec.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-brand-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      AI {rec.agentType.replace('_', ' ')} — {String((rec.decision as Record<string, unknown>).action)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={outcomeVariant[rec.outcome]}>{rec.outcome}</Badge>
                      <span className="text-xs text-gray-400">{Math.round(rec.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
