'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './card';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, className }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isFlat = change !== undefined && change === 0;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive && <TrendingUp className="h-4 w-4 text-emerald-600" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
              {isFlat && <Minus className="h-4 w-4 text-gray-400" />}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-emerald-600',
                  isNegative && 'text-red-600',
                  isFlat && 'text-gray-400'
                )}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-sm text-gray-500">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
