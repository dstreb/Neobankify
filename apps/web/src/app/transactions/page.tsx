'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Search, Download, Filter } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  posted: 'success',
  pending: 'warning',
  declined: 'error',
  reversed: 'default',
};

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <Header
        title="Transactions"
        description={`${MOCK_TRANSACTIONS.length} total transactions`}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by merchant, category, or amount..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="">All Categories</option>
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining</option>
                <option value="Gas">Gas</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
              </select>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="">All Statuses</option>
                <option value="posted">Posted</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rewards</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACTIONS.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900">{txn.merchantName}</p>
                    <p className="text-xs text-gray-500">User: {txn.userId}</p>
                  </TableCell>
                  <TableCell>
                    <Badge>{txn.category}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[txn.status]}>{txn.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {txn.enrichmentData?.rewardEligible ? (
                      <div>
                        {txn.enrichmentData.pointsEarned !== undefined && (
                        <p className="text-sm text-emerald-600 font-medium">
                          {txn.enrichmentData.pointsEarned} pts
                        </p>
                        )}
                        {txn.enrichmentData.cashbackEarned !== undefined && txn.enrichmentData.cashbackEarned > 0 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(txn.enrichmentData.cashbackEarned)} cashback
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(txn.transactionDate)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/transactions/${txn.id}`}>
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
