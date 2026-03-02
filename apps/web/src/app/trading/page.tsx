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
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Zap,
} from 'lucide-react';

const MOCK_STATS = {
  totalTradingVolume: 8_750_000,
  activeTraders: 3_240,
  ordersToday: 1_856,
  aiSignalsGenerated: 425,
  averageWinRate: 58.3,
  riskAlerts: 12,
};

const MOCK_VOLUME_CHART = [
  { label: 'Mon', value: 1_200_000 },
  { label: 'Tue', value: 1_450_000 },
  { label: 'Wed', value: 980_000 },
  { label: 'Thu', value: 1_680_000 },
  { label: 'Fri', value: 2_100_000 },
];

interface Order {
  id: string;
  userId: string;
  userName: string;
  ticker: string;
  side: 'buy' | 'sell';
  orderType: string;
  shares: number;
  price: number;
  status: string;
  timestamp: string;
  aiGenerated: boolean;
}

const MOCK_ORDERS: Order[] = [
  { id: 'o-1', userId: 'u-201', userName: 'Frank Lee', ticker: 'AAPL', side: 'buy', orderType: 'market', shares: 50, price: 192.30, status: 'filled', timestamp: '2026-03-01T14:30:00Z', aiGenerated: false },
  { id: 'o-2', userId: 'u-202', userName: 'Grace Kim', ticker: 'NVDA', side: 'buy', orderType: 'limit', shares: 10, price: 740.00, status: 'filled', timestamp: '2026-03-01T14:25:00Z', aiGenerated: true },
  { id: 'o-3', userId: 'u-203', userName: 'Henry Chen', ticker: 'TSLA', side: 'sell', orderType: 'stop', shares: 25, price: 240.00, status: 'pending', timestamp: '2026-03-01T14:20:00Z', aiGenerated: true },
  { id: 'o-4', userId: 'u-204', userName: 'Iris Patel', ticker: 'MSFT', side: 'buy', orderType: 'market', shares: 30, price: 415.80, status: 'filled', timestamp: '2026-03-01T14:15:00Z', aiGenerated: false },
  { id: 'o-5', userId: 'u-205', userName: 'Jack Brown', ticker: 'AMZN', side: 'sell', orderType: 'limit', shares: 15, price: 185.50, status: 'cancelled', timestamp: '2026-03-01T14:10:00Z', aiGenerated: false },
];

interface RiskAlert {
  id: string;
  type: string;
  userId: string;
  userName: string;
  description: string;
  severity: string;
  timestamp: string;
}

const MOCK_RISK_ALERTS: RiskAlert[] = [
  { id: 'ra-1', type: 'Concentration', userId: 'u-301', userName: 'Kate Wilson', description: 'NVDA position exceeds 25% portfolio allocation', severity: 'high', timestamp: '2026-03-01T13:45:00Z' },
  { id: 'ra-2', type: 'Drawdown', userId: 'u-302', userName: 'Leo Adams', description: 'Portfolio drawdown reached 12.5% (threshold: 15%)', severity: 'medium', timestamp: '2026-03-01T12:30:00Z' },
  { id: 'ra-3', type: 'Daily Loss', userId: 'u-303', userName: 'Mia Thomas', description: 'Daily loss of 2.8% approaching 3% circuit breaker', severity: 'high', timestamp: '2026-03-01T11:15:00Z' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  filled: 'success',
  pending: 'warning',
  cancelled: 'default',
  rejected: 'error',
};

const severityVariant: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

export default function TradingPage() {
  return (
    <DashboardLayout>
      <Header title="Trading Oversight" description="Monitor orders, AI signals, risk alerts, and trading activity" />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Trading Volume"
            value={formatCurrency(MOCK_STATS.totalTradingVolume)}
            change={18.5}
            changeLabel="today"
            icon={<BarChart3 className="h-6 w-6" />}
          />
          <StatCard
            title="Active Traders"
            value={formatNumber(MOCK_STATS.activeTraders)}
            change={4.2}
            icon={<Activity className="h-6 w-6" />}
          />
          <StatCard
            title="Orders Today"
            value={formatNumber(MOCK_STATS.ordersToday)}
            change={12.1}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="AI Signals"
            value={formatNumber(MOCK_STATS.aiSignalsGenerated)}
            change={25.0}
            icon={<Zap className="h-6 w-6" />}
          />
          <StatCard
            title="Avg Win Rate"
            value={`${MOCK_STATS.averageWinRate}%`}
            change={2.1}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Risk Alerts"
            value={String(MOCK_STATS.riskAlerts)}
            change={-8.3}
            icon={<ShieldAlert className="h-6 w-6" />}
          />
        </div>

        {/* Volume Chart + Risk Alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily Trading Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={MOCK_VOLUME_CHART}
                dataKey="value"
                formatValue={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_RISK_ALERTS.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={severityVariant[alert.severity] || 'default'}>{alert.severity}</Badge>
                    <span className="text-xs text-gray-400">{alert.type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.userName}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <span className="text-sm text-gray-500">{MOCK_ORDERS.length} orders</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ORDERS.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.userName}</TableCell>
                    <TableCell className="font-mono font-semibold">{order.ticker}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 font-medium ${order.side === 'buy' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {order.side === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {order.side.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{order.orderType}</TableCell>
                    <TableCell>{order.shares}</TableCell>
                    <TableCell>{formatCurrency(order.price)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.aiGenerated && <Zap className="h-4 w-4 text-amber-500" />}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(order.timestamp).toLocaleTimeString()}
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
