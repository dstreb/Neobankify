'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { User, Lock, Bell, Globe, Shield, Key } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Header title="Settings" description="Manage your account and platform settings" />

      <div className="p-8 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar initials="AD" size="lg" />
              <div>
                <p className="font-semibold text-gray-900">Admin User</p>
                <p className="text-sm text-gray-500">admin@neobankify.com</p>
                <Badge variant="success" className="mt-1">Admin</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First Name" defaultValue="Admin" id="firstName" />
              <Input label="Last Name" defaultValue="User" id="lastName" />
              <Input label="Email" defaultValue="admin@neobankify.com" type="email" id="email" />
              <Input label="Phone" defaultValue="+1 (555) 123-4567" id="phone" />
            </div>
            <div className="flex justify-end">
              <Button size="sm">Save Profile</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Password and authentication settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Current Password" type="password" placeholder="Enter current password" id="currentPassword" />
              <div />
              <Input label="New Password" type="password" placeholder="Enter new password" id="newPassword" />
              <Input label="Confirm Password" type="password" placeholder="Confirm new password" id="confirmPassword" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Enable 2FA</Button>
            </div>
            <div className="flex justify-end">
              <Button size="sm">Update Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive alerts and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Compliance Alerts', description: 'Get notified when new compliance alerts are created', enabled: true },
                { title: 'Transaction Anomalies', description: 'Alerts for suspicious transaction patterns', enabled: true },
                { title: 'AI Agent Decisions', description: 'Notifications when AI agents make high-impact decisions', enabled: false },
                { title: 'New User Signups', description: 'Get notified when new users register', enabled: false },
                { title: 'KYC Status Changes', description: 'Updates when user KYC status changes', enabled: true },
                { title: 'System Health', description: 'Alerts for service outages or degraded performance', enabled: true },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      item.enabled ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              <div>
                <CardTitle>API & Integrations</CardTitle>
                <CardDescription>Manage API keys and third-party integrations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">API Key</p>
                  <p className="text-xs font-mono text-gray-500">nb_live_*****************************k4jd</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Copy</Button>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Webhook URL</p>
                    <p className="text-xs text-gray-500">Configure webhook endpoints for real-time events</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
