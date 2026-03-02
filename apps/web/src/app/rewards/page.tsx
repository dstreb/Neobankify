'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { BarChartCard } from '@/components/charts/bar-chart';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import { Gift, TrendingUp, AlertTriangle, Sparkles, Target } from 'lucide-react';
import { MOCK_REWARDS, MOCK_RECOMMENDATIONS, MOCK_REWARDS_CHART } from '@/lib/mock-data';

const outcomeVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  recommended: 'info',
  accepted: 'success',
  executed: 'success',
  dismissed: 'default',
};

export default function RewardsPage() {
  const rewards = MOCK_REWARDS;

  return (
    <DashboardLayout>
      <Header title="Rewards & AI Insights" description="Rewards optimization and AI-powered recommendations" />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Points"
            value={formatNumber(rewards.totalPoints)}
            change={12.3}
            changeLabel="vs last month"
            icon={<Gift className="h-6 w-6" />}
          />
          <StatCard
            title="Total Cashback"
            value={formatCurrency(rewards.totalCashback)}
            change={8.7}
            changeLabel="vs last month"
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Optimization Score"
            value={`${rewards.optimizationScore}%`}
            change={3.2}
            icon={<Target className="h-6 w-6" />}
          />
          <StatCard
            title="Missed Opportunities"
            value={formatNumber(rewards.missedOpportunities)}
            change={-18.5}
            changeLabel="(fewer is better)"
            icon={<AlertTriangle className="h-6 w-6" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Rewards Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Rewards Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={MOCK_REWARDS_CHART}
                color="#10B981"
                formatValue={(v) => `${(v / 1000).toFixed(0)}K`}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pending Points</span>
                  <span className="text-sm font-semibold">{formatNumber(rewards.pendingPoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Redeemed Points</span>
                  <span className="text-sm font-semibold">{formatNumber(rewards.redeemedPoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Monthly Earnings</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatNumber(rewards.monthlyEarnings)} pts</span>
                </div>
              </div>

              {/* Optimization Score Gauge */}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Optimization Score</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500"
                      style={{ width: `${rewards.optimizationScore}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{rewards.optimizationScore}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_RECOMMENDATIONS.map((rec) => (
                <div key={rec.id} className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Sparkles className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {rec.agentType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <Badge variant={outcomeVariant[rec.outcome]}>{rec.outcome}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Action: {String((rec.decision as Record<string, unknown>).action).replace(/_/g, ' ')}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>User: {rec.userId}</span>
                      <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                      <span>{formatRelativeTime(rec.createdAt)}</span>
                    </div>
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
