'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getDashboardPath } from '@/lib/constants';

const TEST_CREDENTIALS = [
  { role: 'Admin',        email: 'admin@creditsea.com',        color: '#6366f1' },
  { role: 'Sales',        email: 'sales@creditsea.com',        color: '#0ea5e9' },
  { role: 'Sanction',     email: 'sanction@creditsea.com',     color: '#f59e0b' },
  { role: 'Disbursement', email: 'disbursement@creditsea.com', color: '#10b981' },
  { role: 'Collection',   email: 'collection@creditsea.com',   color: '#ef4444' },
  { role: 'Borrower',     email: 'borrower@creditsea.com',     color: '#8b5cf6' },
];

const TEST_PASSWORD = 'Password@123';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const fillTestCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword(TEST_PASSWORD);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        router.push(getDashboardPath(user.role));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout animate-fade-in">
      {/* Brand Panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">CreditSea</div>
        <div className="auth-brand-tagline">Loan Management System</div>
        <div className="auth-brand-desc">
          Institutional rigor for modern lending operations. Manage loan applications through their complete lifecycle — from origination to closure.
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CreditSea</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>Sign In</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Access your account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div className="error-box">{error}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}
            >
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </p>

          {/* ── Test Credentials Quick-Fill ── */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-default)', paddingTop: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}>
              <span style={{ fontSize: '0.875rem' }}>🧪</span>
              Test Credentials
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
            }}>
              {TEST_CREDENTIALS.map(({ role, email: testEmail, color }) => (
                <button
                  key={role}
                  id={`test-login-${role.toLowerCase()}`}
                  type="button"
                  onClick={() => fillTestCredentials(testEmail)}
                  style={{
                    padding: '0.5rem 0.625rem',
                    border: `1px solid ${color}30`,
                    borderRadius: '0.375rem',
                    background: `${color}08`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${color}15`;
                    e.currentTarget.style.borderColor = `${color}50`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${color}08`;
                    e.currentTarget.style.borderColor = `${color}30`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600 }}>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
