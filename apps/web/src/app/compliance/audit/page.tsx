'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, Download } from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

const actionVariant: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  'user.login': 'info',
  'user.kyc_submitted': 'info',
  'user.suspended': 'error',
  'transaction.create': 'success',
  'card.set_primary': 'default',
  'compliance.alert_created': 'warning',
  'agent.decision': 'info',
  'tenant.config_updated': 'default',
};

export default function AuditLogPage() {
  return (
    <DashboardLayout>
      <Header
        title="Audit Log"
        description="Complete audit trail of all platform actions"
        actions={
          <div className="flex items-center gap-3">
            <Link href="/compliance">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Compliance
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="p-8">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AUDIT_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={actionVariant[log.action] || 'default'}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">{log.entityType}</p>
                      <p className="text-xs text-gray-500">{log.entityId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/users/${log.userId}`} className="text-sm text-brand-600 hover:underline">
                      {log.userId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{log.tenantId}</TableCell>
                  <TableCell className="text-sm font-mono">{log.ipAddress || '-'}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>
                    {(log.beforeState || log.afterState) ? (
                      <span className="text-xs text-gray-500">
                        {log.beforeState && log.afterState
                          ? `${Object.keys(log.beforeState).length} field(s) changed`
                          : log.afterState
                          ? `${Object.keys(log.afterState).length} field(s) set`
                          : '-'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
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
