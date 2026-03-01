'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Receipt, Tag, Gift, AlertTriangle } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data';

export default function TransactionDetailPage() {
  const params = useParams();
  const txnId = params.id as string;
  const txn = MOCK_TRANSACTIONS.find((t) => t.id === txnId);

  if (!txn) {
    return (
      <DashboardLayout>
        <Header title="Transaction Not Found" />
        <div className="p-8">
          <p className="text-gray-500">No transaction found with ID: {txnId}</p>
          <Link href="/transactions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header
        title={txn.merchantName}
        description={`Transaction ${txn.id}`}
        actions={
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-400" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Amount</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCurrency(txn.amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Merchant</dt>
                  <dd className="text-sm font-medium text-gray-900">{txn.merchantName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd><Badge>{txn.category}</Badge></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <Badge variant={txn.status === 'posted' ? 'success' : txn.status === 'pending' ? 'warning' : 'error'}>
                      {txn.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(txn.transactionDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">User ID</dt>
                  <dd>
                    <Link href={`/users/${txn.userId}`} className="text-sm text-brand-600 hover:underline">
                      {txn.userId}
                    </Link>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Enrichment Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-400" />
                Enrichment & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txn.enrichmentData ? (
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">MCC Code</dt>
                    <dd className="text-sm font-mono text-gray-900">{txn.enrichmentData.mcc}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Enriched Category</dt>
                    <dd className="text-sm text-gray-900">{txn.enrichmentData.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Reward Eligible</dt>
                    <dd>
                      <Badge variant={txn.enrichmentData.rewardEligible ? 'success' : 'default'}>
                        {txn.enrichmentData.rewardEligible ? 'Yes' : 'No'}
                      </Badge>
                    </dd>
                  </div>
                  {txn.enrichmentData.pointsEarned !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 flex items-center gap-1">
                        <Gift className="h-4 w-4" /> Points Earned
                      </dt>
                      <dd className="text-sm font-semibold text-emerald-600">
                        {txn.enrichmentData.pointsEarned} pts
                      </dd>
                    </div>
                  )}
                  {txn.enrichmentData.cashbackEarned !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Cashback Earned</dt>
                      <dd className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(txn.enrichmentData.cashbackEarned)}
                      </dd>
                    </div>
                  )}
                  {txn.enrichmentData.missedValue !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Missed Value
                      </dt>
                      <dd className="text-sm font-semibold text-amber-600">
                        {formatCurrency(txn.enrichmentData.missedValue)}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No enrichment data available for this transaction</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
