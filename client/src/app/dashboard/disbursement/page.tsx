'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/constants';

interface Loan {
  _id: string;
  borrower: { fullName: string; email: string; pan: string };
  sanctionedBy?: { fullName: string };
  sanctionedAt?: string;
  loanAmount: number;
  tenureDays: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  createdAt: string;
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/dashboard/disbursement/loans');
      setLoans(res.data.loans);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleDisburse = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/dashboard/disbursement/loans/${id}/disburse`);
      setLoans((prev) => prev.filter((l) => l._id !== id));
      setConfirmId(null);
    } catch { /* handled */ }
    finally { setActionLoading(null); }
  };

  const confirmLoan = loans.find((l) => l._id === confirmId);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--accent-primary)' }}>Fund Disbursement</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Release funds for sanctioned loans
          </p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {loans.length} Pending Release
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmId && confirmLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27, 77, 62, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Confirm Disbursement</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              You are about to release funds for this loan. This action is irreversible.
            </p>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {confirmLoan.borrower.fullName}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Principal Amount</span>
                  <strong style={{ fontSize: '1rem' }}>{formatCurrency(confirmLoan.loanAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Tenure</span>
                  <strong style={{ fontSize: '1rem' }}>{confirmLoan.tenureDays} days</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Interest Amount</span>
                  <strong style={{ fontSize: '1rem' }}>{formatCurrency(confirmLoan.simpleInterest)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Total Repayment</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--accent-primary)' }}>{formatCurrency(confirmLoan.totalRepayment)}</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => handleDisburse(confirmId)}
                disabled={actionLoading === confirmId}
              >
                {actionLoading === confirmId ? <><span className="spinner" /> Releasing...</> : 'Confirm Release ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
      ) : loans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }}>✅</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>All caught up!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>No sanctioned loans pending disbursement.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loans.map((loan) => (
            <div key={loan._id} className="card" style={{ padding: '1.5rem 1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>{loan.borrower.fullName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {loan.borrower.email} <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>|</span> PAN: <span style={{ fontFamily: 'monospace' }}>{loan.borrower.pan}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(loan.loanAmount)}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{loan.tenureDays} days tenure</div>
                </div>
              </div>

              {/* Loan details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interest (SI)</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatCurrency(loan.simpleInterest)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repayment</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--accent-primary)' }}>{formatCurrency(loan.totalRepayment)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanctioned By</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginTop: '0.25rem' }}>{loan.sanctionedBy?.fullName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanctioned On</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginTop: '0.25rem' }}>{loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}</div>
                </div>
              </div>

              {/* Disburse action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '0.625rem 2rem' }}
                  onClick={() => setConfirmId(loan._id)}
                >
                  Release Funds →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
