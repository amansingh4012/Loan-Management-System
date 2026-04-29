'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { formatCurrency, formatDate, LOAN_STATUS_CONFIG } from '@/lib/constants';

interface Loan {
  _id: string;
  loanAmount: number;
  tenureDays: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  closedAt?: string;
}

export default function MyLoansPage() {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await api.get('/borrower/my-loans');
        setLoans(res.data.loans);
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    fetchLoans();
  }, []);

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Nav */}
      <div className="topnav">
        <div className="topnav-logo">CreditSea</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: '0.25rem' }}>My Loans</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track the status of your loan applications</p>
          </div>
          <a href="/borrower/profile" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1.25rem' }}>
            + New Application
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
        ) : loans.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem', opacity: 0.4 }}>📋</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>No loan applications yet.</p>
            <a href="/borrower/profile" className="btn-primary" style={{ textDecoration: 'none' }}>Apply Now</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loans.map((loan) => {
              const sc = LOAN_STATUS_CONFIG[loan.status] || LOAN_STATUS_CONFIG.applied;
              return (
                <div key={loan._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{formatCurrency(loan.loanAmount)}</span>
                        <span className={`badge ${sc.badgeClass}`}>{sc.label}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {loan.tenureDays} days · Applied {formatDate(loan.createdAt)}
                      </p>
                      {loan.rejectionReason && (
                        <div style={{ background: 'var(--danger-light)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
                          Reason: {loan.rejectionReason}
                        </div>
                      )}
                      {loan.status === 'closed' && loan.closedAt && (
                        <div style={{ background: 'var(--success-light)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--success)' }}>
                          ✓ Fully Paid · Closed {formatDate(loan.closedAt)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repayment</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{formatCurrency(loan.totalRepayment)}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: loan.outstandingBalance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {formatCurrency(loan.outstandingBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
