'use client';

import { useState, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';

const STEPS = ['Personal Details', 'Salary Slip', 'Apply Loan'];

export default function ApplyPage() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenureDays, setTenureDays] = useState(180);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const calculation = useMemo(() => {
    const si = (loanAmount * 12 * tenureDays) / (365 * 100);
    const roundedSI = Math.round(si * 100) / 100;
    const totalRepayment = Math.round((loanAmount + roundedSI) * 100) / 100;
    return { si: roundedSI, totalRepayment };
  }, [loanAmount, tenureDays]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/borrower/apply-loan', { loanAmount, tenureDays });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally { setLoading(false); }
  };

  const activeStep = 2;

  if (success) {
    return (
      <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem 2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>✓</div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: '0.5rem' }}>Application Submitted</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>Your loan application is now under review by the sanction team.</p>
            <button className="btn-primary" onClick={() => router.push('/borrower/my-loans')} style={{ padding: '0.75rem 2rem' }}>View My Loans</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="topnav">
        <div className="topnav-logo">CreditSea</div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Step 3 of 3</span>
      </div>

      <div style={{ maxWidth: 600, margin: '3rem auto', padding: '0 1rem' }}>
        {/* Step Indicator */}
        <div className="step-indicator">
          {STEPS.map((step, i) => (
            <div key={step} style={{ display: 'contents' }}>
              <div className="step-item">
                <div className={`step-circle ${i === activeStep ? 'active' : i < activeStep ? 'completed' : 'inactive'}`}>
                  {i < activeStep ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i === activeStep ? 'active' : i < activeStep ? 'completed' : 'inactive'}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`step-connector ${i < activeStep ? 'completed' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Configure Your Loan</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.75rem' }}>Interest rate is fixed at 12% p.a. (Simple Interest).</p>

          {error && <div className="error-box" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Loan Amount Slider */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Loan Amount</label>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(loanAmount)}</span>
              </div>
              <input id="loan-amount-slider" type="range" min={50000} max={500000} step={10000} value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}><span>₹50K</span><span>₹5L</span></div>
            </div>

            {/* Tenure Slider */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Tenure</label>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{tenureDays} days</span>
              </div>
              <input id="tenure-slider" type="range" min={30} max={365} step={1} value={tenureDays} onChange={(e) => setTenureDays(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}><span>30 days</span><span>365 days</span></div>
            </div>

            {/* Loan Breakdown Panel */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loan Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Principal</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{formatCurrency(loanAmount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Interest (12% p.a.)</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{formatCurrency(calculation.si)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Tenure</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{tenureDays} days</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Repayment</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(calculation.totalRepayment)}</div>
                </div>
              </div>
            </div>

            <button id="apply-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? <><span className="spinner" /> Submitting...</> : 'Apply for Loan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
