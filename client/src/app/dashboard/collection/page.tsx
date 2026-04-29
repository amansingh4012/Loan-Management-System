'use client';

import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/constants';

interface Loan {
  _id: string;
  borrower: { fullName: string; email: string };
  loanAmount: number;
  totalRepayment: number;
  outstandingBalance: number;
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy?: { fullName: string };
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLoans = async () => {
    try {
      const res = await api.get('/dashboard/collection/loans');
      setLoans(res.data.loans);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const fetchPayments = async (loanId: string) => {
    try {
      const res = await api.get(`/dashboard/collection/loans/${loanId}/payments`);
      setPayments(res.data.payments);
    } catch { /* handled */ }
  };

  const openPaymentPanel = (loanId: string) => {
    setSelectedLoan(loanId);
    setError('');
    setSuccessMsg('');
    setUtr('');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    fetchPayments(loanId);
  };

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setError('');
    setSuccessMsg('');
    setPayLoading(true);

    try {
      const res = await api.post(`/dashboard/collection/loans/${selectedLoan}/payment`, {
        utrNumber: utr.trim(),
        amount: Number(amount),
        paymentDate,
      });
      setSuccessMsg(res.data.message);
      setUtr('');
      setAmount('');
      fetchPayments(selectedLoan);

      if (res.data.loan.status === 'closed') {
        setLoans((prev) => prev.filter((l) => l._id !== selectedLoan));
        setTimeout(() => setSelectedLoan(null), 2000);
      } else {
        setLoans((prev) => prev.map((l) =>
          l._id === selectedLoan ? { ...l, outstandingBalance: res.data.loan.outstandingBalance } : l
        ));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally { setPayLoading(false); }
  };

  const currentLoan = loans.find((l) => l._id === selectedLoan);

  const getProgress = (loan: Loan) => {
    const paid = loan.totalRepayment - loan.outstandingBalance;
    return Math.round((paid / loan.totalRepayment) * 100);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--accent-primary)' }}>Collection Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Manage active loans and record payments
          </p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {loans.length} Active Accounts
        </div>
      </div>

      {/* Payment Modal */}
      {selectedLoan && currentLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27, 77, 62, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Record Payment</h3>
              <button onClick={() => setSelectedLoan(null)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>✕</button>
            </div>

            {/* Loan summary */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{currentLoan.borrower.fullName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.125rem' }}>{formatCurrency(currentLoan.totalRepayment)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--success)', marginTop: '0.125rem' }}>{formatCurrency(currentLoan.totalRepayment - currentLoan.outstandingBalance)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--warning)', marginTop: '0.125rem' }}>{formatCurrency(currentLoan.outstandingBalance)}</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', borderRadius: '0.25rem', height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${getProgress(currentLoan)}%`,
                  height: '100%',
                  background: 'var(--success)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                {getProgress(currentLoan)}% recovered
              </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: '1.25rem' }}>{error}</div>}
            {successMsg && <div className="success-box" style={{ marginBottom: '1.25rem' }}>{successMsg}</div>}

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>UTR Number</label>
                <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Unique Transaction Reference" required style={{ fontFamily: 'monospace' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Amount (₹)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={0.01} step={0.01} max={currentLoan.outstandingBalance} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} max={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={payLoading || currentLoan.outstandingBalance === 0} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                {payLoading ? <><span className="spinner" /> Recording...</> : 'Record Payment ✓'}
              </button>
            </form>

            {payments.length > 0 && (
              <>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</h4>
                <div className="table-container" style={{ borderRadius: '0.5rem' }}>
                  <table>
                    <thead><tr><th>UTR Number</th><th>Amount</th><th>Date</th></tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{p.utrNumber}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(p.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
      ) : loans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }}>✅</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>All caught up!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>No active loans requiring collection.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loans.map((loan) => {
            const progress = getProgress(loan);
            const paid = loan.totalRepayment - loan.outstandingBalance;
            return (
              <div key={loan._id} className="card" style={{ padding: '1.5rem 1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>{loan.borrower.fullName}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{loan.borrower.email}</div>
                  </div>
                  <button className="btn-outline" style={{ padding: '0.5rem 1.25rem' }} onClick={() => openPaymentPanel(loan._id)}>
                    View / Record Payment
                  </button>
                </div>

                {/* Loan stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Amount</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.25rem' }}>{formatCurrency(loan.loanAmount)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repayment</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.25rem' }}>{formatCurrency(loan.totalRepayment)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--success)', marginTop: '0.25rem' }}>{formatCurrency(paid)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--warning)', marginTop: '0.25rem' }}>{formatCurrency(loan.outstandingBalance)}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.25rem', height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress >= 100 ? 'var(--success)' : 'var(--accent-primary)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                    {progress}% recovered
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
