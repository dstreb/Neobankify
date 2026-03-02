'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Percent, TrendingUp, AlertCircle } from 'lucide-react';
import { MOCK_CARDS } from '@/lib/mock-data';

const networkColors: Record<string, string> = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-red-500 to-orange-600',
  amex: 'from-emerald-600 to-teal-800',
  discover: 'from-amber-500 to-orange-600',
};

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  frozen: 'warning',
  cancelled: 'error',
};

export default function CardsPage() {
  const activeCards = MOCK_CARDS.filter((c) => c.status === 'active').length;
  const frozenCards = MOCK_CARDS.filter((c) => c.status === 'frozen').length;
  const avgRewardRate = MOCK_CARDS.reduce((sum, c) => sum + c.rewardRate, 0) / MOCK_CARDS.length;

  return (
    <DashboardLayout>
      <Header title="Cards" description="Card portfolio management and analytics" />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Cards"
            value={String(MOCK_CARDS.length)}
            icon={<CreditCard className="h-6 w-6" />}
          />
          <StatCard
            title="Active Cards"
            value={String(activeCards)}
            change={5}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Avg Reward Rate"
            value={`${avgRewardRate.toFixed(1)}%`}
            icon={<Percent className="h-6 w-6" />}
          />
          <StatCard
            title="Frozen Cards"
            value={String(frozenCards)}
            icon={<AlertCircle className="h-6 w-6" />}
          />
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_CARDS.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              {/* Card Visual */}
              <div className={`bg-gradient-to-br ${networkColors[card.cardNetwork]} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {card.cardType}
                  </span>
                  <span className="text-sm font-bold uppercase">{card.cardNetwork}</span>
                </div>
                <div className="mt-8">
                  <p className="font-mono text-lg tracking-wider">**** **** **** {card.lastFour}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-70">Nickname</p>
                    <p className="text-sm font-medium">{card.nickname}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">Expires</p>
                    <p className="text-sm font-medium">{card.expirationDate}</p>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[card.status]}>{card.status}</Badge>
                    {card.isPrimary && <Badge variant="info">Primary</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{card.rewardRate}% back</p>
                    <p className="text-xs text-gray-500">User: {card.userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
