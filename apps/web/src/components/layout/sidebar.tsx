'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  CreditCard,
  Gift,
  ShieldCheck,
  Building2,
  Settings,
  LogOut,
  Sparkles,
  TrendingUp,
  BarChart3,
  Landmark,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Cards', href: '/cards', icon: CreditCard },
  { name: 'Rewards & AI', href: '/rewards', icon: Gift },
  { name: 'Investing', href: '/investing', icon: TrendingUp },
  { name: 'Trading', href: '/trading', icon: BarChart3 },
  { name: 'Lending', href: '/lending', icon: Landmark },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Neobankify</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-brand-600' : 'text-gray-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-100 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <LogOut className="h-5 w-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
