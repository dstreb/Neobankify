'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { BarChartCard } from '@/components/charts/bar-chart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const MOCK_STATS = {
  totalAUM: 145_000_000,
  activeAccounts: 12_450,
  avgPortfolioSize: 11_647,
  rebalancesThisMonth: 342,
  taxLossHarvested: 285_000,
  suitabilityCompletionRate: 94.2,
};

const MOCK_AUM_CHART = [
  { label: 'Sep', value: 98_000_000 },
  { label: 'Oct', value: 108_000_000 },
  { label: 'Nov', value: 115_000_000 },
  { label: 'Dec', value: 122_000_000 },
  { label: 'Jan', value: 135_000_000 },
  { label: 'Feb', value: 145_000_000 },
];

interface Account {
  id: string;
  userId: string;
  userName: string;
  portfolioValue: number;
  riskLevel: string;
  returnPct: number;
  lastRebalance: string;
  status: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: 'ia-1', userId: 'u-101', userName: 'Alice Johnson', portfolioValue: 45_200, riskLevel: 'Moderate', returnPct: 12.4, lastRebalance: '2026-02-20', status: 'active' },
  { id: 'ia-2', userId: 'u-102', userName: 'Bob Smith', portfolioValue: 128_500, riskLevel: 'Aggressive', returnPct: 18.7, lastRebalance: '2026-02-15', status: 'active' },
  { id: 'ia-3', userId: 'u-103', userName: 'Carol Davis', portfolioValue: 22_100, riskLevel: 'Conservative', returnPct: 5.2, lastRebalance: '2026-02-25', status: 'active' },
  { id: 'ia-4', userId: 'u-104', userName: 'Dan Wilson', portfolioValue: 67_800, riskLevel: 'Moderate', returnPct: -2.1, lastRebalance: '2026-01-30', status: 'needs_rebalance' },
  { id: 'ia-5', userId: 'u-105', userName: 'Eve Martinez', portfolioValue: 15_400, riskLevel: 'Moderate', returnPct: 8.9, lastRebalance: '2026-02-18', status: 'active' },
];

const riskBadgeVariant: Record<string, 'info' | 'warning' | 'error' | 'success' | 'default'> = {
  Conservative: 'info',
  Moderate: 'warning',
  Aggressive: 'error',
};

export default function InvestingPage() {
  return (
    <DashboardLayout>
      <Header title="Investment Management" description="Monitor portfolios, suitability, and automated investing" />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total AUM"
            value={formatCurrency(MOCK_STATS.totalAUM)}
            change={14.2}
            changeLabel="vs last month"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Active Accounts"
            value={formatNumber(MOCK_STATS.activeAccounts)}
            change={6.8}
            changeLabel="vs last month"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Avg Portfolio"
            value={formatCurrency(MOCK_STATS.avgPortfolioSize)}
            change={3.1}
            icon={<PieChart className="h-6 w-6" />}
          />
          <StatCard
            title="Rebalances"
            value={formatNumber(MOCK_STATS.rebalancesThisMonth)}
            change={22.5}
            changeLabel="this month"
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Tax-Loss Harvested"
            value={formatCurrency(MOCK_STATS.taxLossHarvested)}
            change={45.0}
            changeLabel="this month"
            icon={<ShieldCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Suitability Rate"
            value={`${MOCK_STATS.suitabilityCompletionRate}%`}
            change={1.5}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
        </div>

        {/* AUM Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Assets Under Management (AUM)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCard
              data={MOCK_AUM_CHART}
              dataKey="value"
              formatValue={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
            />
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Investment Accounts</CardTitle>
              <span className="text-sm text-gray-500">{MOCK_ACCOUNTS.length} accounts</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Portfolio Value</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Last Rebalance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ACCOUNTS.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.userName}</TableCell>
                    <TableCell>{formatCurrency(account.portfolioValue)}</TableCell>
                    <TableCell>
                      <Badge variant={riskBadgeVariant[account.riskLevel] || 'default'}>
                        {account.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={account.returnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {account.returnPct >= 0 ? '+' : ''}{account.returnPct.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>{new Date(account.lastRebalance).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'active' ? 'success' : 'warning'}>
                        {account.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
