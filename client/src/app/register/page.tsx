'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      router.push('/borrower/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          Create your borrower account to apply for loans. Our streamlined process guides you through profile verification, document upload, and loan configuration.
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CreditSea</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>Create Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Register as a borrower</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div className="error-box">{error}</div>}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                id="register-email"
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
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}
            >
              {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
