'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ROLES, canAccessModule } from '@/lib/constants';

const NAV_ITEMS = [
  { label: 'Sales Tracker', path: '/dashboard/sales', module: ROLES.SALES, icon: '📊' },
  { label: 'Sanction Review', path: '/dashboard/sanction', module: ROLES.SANCTION, icon: '📋' },
  { label: 'Disbursement', path: '/dashboard/disbursement', module: ROLES.DISBURSEMENT, icon: '💸' },
  { label: 'Collection', path: '/dashboard/collection', module: ROLES.COLLECTION, icon: '📈' },
  { label: 'Activity History', path: '/dashboard/history', module: ROLES.ADMIN, icon: '🕓' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user && user.role === ROLES.BORROWER) {
      router.replace('/borrower/my-loans');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  const visibleNav = NAV_ITEMS.filter((item) => canAccessModule(user.role, item.module));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">CreditSea</div>
        <div className="sidebar-tagline">Loan Management System</div>
        
        <nav className="sidebar-nav">
          {visibleNav.map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span style={{ fontSize: '1.125rem', opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-logout">
          <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.125rem', fontWeight: 500 }}>
            {user.fullName || user.email.split('@')[0]}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 600 }}>
            {user.role}
          </div>
          <button onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
