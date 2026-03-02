'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { BarChartCard } from '@/components/charts/bar-chart';
import { DonutChartCard } from '@/components/charts/donut-chart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Landmark,
  DollarSign,
  Users,
  FileCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const MOCK_STATS = {
  totalLoanBook: 32_500_000,
  activeLoans: 4_280,
  applicationsThisMonth: 856,
  approvalRate: 72.4,
  avgInterestRate: 9.85,
  delinquencyRate: 1.8,
};

const MOCK_ORIGINATION_CHART = [
  { label: 'Sep', value: 3_200_000 },
  { label: 'Oct', value: 3_800_000 },
  { label: 'Nov', value: 4_100_000 },
  { label: 'Dec', value: 3_500_000 },
  { label: 'Jan', value: 4_600_000 },
  { label: 'Feb', value: 5_200_000 },
];

const MOCK_GRADE_CHART = [
  { label: 'A+ / A', value: 35 },
  { label: 'B', value: 28 },
  { label: 'C', value: 22 },
  { label: 'D', value: 10 },
  { label: 'E', value: 5 },
];

interface LoanApplication {
  id: string;
  userId: string;
  userName: string;
  loanType: string;
  requestedAmount: number;
  riskGrade: string;
  interestRate: number;
  dti: number;
  creditScore: number;
  status: string;
  appliedAt: string;
}

const MOCK_APPLICATIONS: LoanApplication[] = [
  { id: 'la-1', userId: 'u-401', userName: 'Nancy Rivera', loanType: 'Personal', requestedAmount: 15000, riskGrade: 'A', interestRate: 7.49, dti: 28.5, creditScore: 745, status: 'approved', appliedAt: '2026-03-01T10:00:00Z' },
  { id: 'la-2', userId: 'u-402', userName: 'Oscar Nguyen', loanType: 'Line of Credit', requestedAmount: 25000, riskGrade: 'B', interestRate: 10.99, dti: 35.2, creditScore: 682, status: 'approved', appliedAt: '2026-03-01T09:30:00Z' },
  { id: 'la-3', userId: 'u-403', userName: 'Pat Cooper', loanType: 'Personal', requestedAmount: 8000, riskGrade: 'A+', interestRate: 5.99, dti: 18.0, creditScore: 790, status: 'approved', appliedAt: '2026-03-01T09:00:00Z' },
  { id: 'la-4', userId: 'u-404', userName: 'Quinn Hall', loanType: 'Emergency', requestedAmount: 2000, riskGrade: 'D', interestRate: 18.99, dti: 42.5, creditScore: 580, status: 'conditional', appliedAt: '2026-03-01T08:30:00Z' },
  { id: 'la-5', userId: 'u-405', userName: 'Rosa Torres', loanType: 'Personal', requestedAmount: 30000, riskGrade: 'E', interestRate: 0, dti: 55.0, creditScore: 520, status: 'denied', appliedAt: '2026-03-01T08:00:00Z' },
];

const gradeVariant: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  'A+': 'success',
  'A': 'success',
  'B': 'info',
  'C': 'warning',
  'D': 'error',
  'E': 'error',
};

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  approved: 'success',
  conditional: 'warning',
  denied: 'error',
  pending: 'info',
  in_review: 'info',
};

export default function LendingPage() {
  return (
    <DashboardLayout>
      <Header title="Loan Management" description="Monitor loan book, applications, underwriting, and compliance" />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Loan Book"
            value={formatCurrency(MOCK_STATS.totalLoanBook)}
            change={8.5}
            changeLabel="vs last month"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Active Loans"
            value={formatNumber(MOCK_STATS.activeLoans)}
            change={5.2}
            icon={<Landmark className="h-6 w-6" />}
          />
          <StatCard
            title="Applications"
            value={formatNumber(MOCK_STATS.applicationsThisMonth)}
            change={12.8}
            changeLabel="this month"
            icon={<FileCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Approval Rate"
            value={`${MOCK_STATS.approvalRate}%`}
            change={-1.2}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Avg Rate"
            value={`${MOCK_STATS.avgInterestRate}%`}
            change={0.3}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Delinquency"
            value={`${MOCK_STATS.delinquencyRate}%`}
            change={-0.4}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Loan Originations</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={MOCK_ORIGINATION_CHART}
                dataKey="value"
                formatValue={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio by Risk Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChartCard data={MOCK_GRADE_CHART} />
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <span className="text-sm text-gray-500">{MOCK_APPLICATIONS.length} applications</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>DTI</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_APPLICATIONS.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.userName}</TableCell>
                    <TableCell>{app.loanType}</TableCell>
                    <TableCell>{formatCurrency(app.requestedAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={gradeVariant[app.riskGrade] || 'default'}>{app.riskGrade}</Badge>
                    </TableCell>
                    <TableCell>{app.interestRate > 0 ? `${app.interestRate}%` : '—'}</TableCell>
                    <TableCell>
                      <span className={app.dti > 43 ? 'text-red-600 font-medium' : ''}>
                        {app.dti}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={app.creditScore < 620 ? 'text-red-600 font-medium' : app.creditScore >= 740 ? 'text-emerald-600 font-medium' : ''}>
                        {app.creditScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[app.status] || 'default'}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(app.appliedAt).toLocaleString()}
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
