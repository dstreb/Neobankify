'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChartDataPoint } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

interface DonutChartCardProps {
  data: ChartDataPoint[];
  height?: number;
}

export function DonutChartCard({ data, height = 250 }: DonutChartCardProps) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`${value}%`]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-medium text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
