'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { MOCK_COMPLIANCE_ALERTS } from '@/lib/mock-data';

const severityVariant: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const statusVariant: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  open: 'error',
  in_review: 'warning',
  resolved: 'success',
  dismissed: 'default',
};

export default function CompliancePage() {
  const openAlerts = MOCK_COMPLIANCE_ALERTS.filter((a) => a.status === 'open').length;
  const inReview = MOCK_COMPLIANCE_ALERTS.filter((a) => a.status === 'in_review').length;
  const resolved = MOCK_COMPLIANCE_ALERTS.filter((a) => a.status === 'resolved').length;
  const critical = MOCK_COMPLIANCE_ALERTS.filter((a) => a.severity === 'critical').length;

  return (
    <DashboardLayout>
      <Header
        title="Compliance & Alerts"
        description="Monitor compliance alerts, KYC status, and regulatory issues"
        actions={
          <Link href="/compliance/audit">
            <Button variant="outline" size="sm">View Audit Log</Button>
          </Link>
        }
      />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Open Alerts"
            value={String(openAlerts)}
            icon={<ShieldAlert className="h-6 w-6" />}
          />
          <StatCard
            title="In Review"
            value={String(inReview)}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Critical"
            value={String(critical)}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
          <StatCard
            title="Resolved"
            value={String(resolved)}
            change={12}
            icon={<ShieldCheck className="h-6 w-6" />}
          />
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compliance Alerts</CardTitle>
              <div className="flex items-center gap-2">
                <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_COMPLIANCE_ALERTS.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <p className="text-sm text-gray-900 max-w-xs truncate">{alert.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge>{alert.type.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[alert.status]}>{alert.status.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    {alert.userId ? (
                      <Link href={`/users/${alert.userId}`} className="text-brand-600 hover:underline text-sm">
                        {alert.userId}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatRelativeTime(alert.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {alert.status === 'open' && (
                      <Button variant="outline" size="sm">Review</Button>
                    )}
                    {alert.status === 'resolved' && alert.resolution && (
                      <span className="text-xs text-gray-500" title={alert.resolution}>Resolved</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
