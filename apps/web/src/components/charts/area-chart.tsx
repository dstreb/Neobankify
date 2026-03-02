'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '@/types';

interface AreaChartCardProps {
  data: ChartDataPoint[];
  dataKey?: string;
  dataKey2?: string;
  color?: string;
  color2?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function AreaChartCard({
  data,
  dataKey = 'value',
  dataKey2,
  color = '#3B82F6',
  color2 = '#10B981',
  height = 300,
  formatValue,
}: AreaChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {dataKey2 && (
            <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color2} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color2} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={formatValue} />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number) => [formatValue ? formatValue(value) : value.toLocaleString()]}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill="url(#gradient1)" strokeWidth={2} />
        {dataKey2 && (
          <Area type="monotone" dataKey={dataKey2} stroke={color2} fill="url(#gradient2)" strokeWidth={2} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
