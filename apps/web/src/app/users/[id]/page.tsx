'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { ArrowLeft, Mail, Shield, CreditCard, ArrowLeftRight } from 'lucide-react';
import { MOCK_USERS, MOCK_TRANSACTIONS, MOCK_CARDS } from '@/lib/mock-data';

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  suspended: 'warning',
  deactivated: 'error',
};

const kycVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  approved: 'success',
  pending: 'warning',
  in_review: 'info',
  rejected: 'error',
  expired: 'error',
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const user = MOCK_USERS.find((u) => u.id === userId);
  const userTransactions = MOCK_TRANSACTIONS.filter((t) => t.userId === userId);
  const userCards = MOCK_CARDS.filter((c) => c.userId === userId);

  if (!user) {
    return (
      <DashboardLayout>
        <Header title="User Not Found" />
        <div className="p-8">
          <p className="text-gray-500">No user found with ID: {userId}</p>
          <Link href="/users">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </Link>
            <Button variant="danger" size="sm">Suspend User</Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* User Profile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center">
                <Avatar initials={getInitials(user.firstName, user.lastName)} size="lg" />
                <h2 className="mt-4 text-lg font-semibold">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={statusVariant[user.status]}>{user.status}</Badge>
                  <Badge variant={kycVariant[user.kycStatus]}>KYC: {user.kycStatus.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Joined {formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{userCards.length} linked cards</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{userTransactions.length} transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {/* Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Linked Cards ({userCards.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {userCards.length === 0 ? (
                  <p className="text-sm text-gray-500">No cards linked yet</p>
                ) : (
                  <div className="space-y-3">
                    {userCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{card.nickname}</p>
                            <p className="text-xs text-gray-500">{card.cardNetwork.toUpperCase()} ****{card.lastFour}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {card.isPrimary && <Badge variant="info">Primary</Badge>}
                          <Badge variant={card.status === 'active' ? 'success' : card.status === 'frozen' ? 'warning' : 'error'}>
                            {card.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions ({userTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {userTransactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                        <div>
                          <p className="text-sm font-medium">{txn.merchantName}</p>
                          <p className="text-xs text-gray-500">{txn.category} &middot; {formatDate(txn.transactionDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(txn.amount)}</p>
                          <Badge variant={txn.status === 'posted' ? 'success' : txn.status === 'pending' ? 'warning' : 'error'}>
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
