'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/lib/utils';
import { Search, UserPlus, Download } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  suspended: 'warning',
  deactivated: 'error',
};

const kycVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  in_review: 'info',
  rejected: 'error',
  expired: 'error',
};

export default function UsersPage() {
  return (
    <DashboardLayout>
      <Header
        title="Users"
        description={`${MOCK_USERS.length} total users`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Search & Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="">All KYC</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/users/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <Avatar initials={getInitials(user.firstName, user.lastName)} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[user.status]}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={kycVariant[user.kycStatus]}>{user.kycStatus.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/users/${user.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
