'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/constants';

interface Application {
  _id: string;
  borrower: {
    fullName: string;
    email: string;
    pan: string;
    monthlySalary: number;
    employmentMode: string;
    dateOfBirth: string;
  };
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  createdAt: string;
}

export default function SanctionPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchApps = async () => {
    try {
      const res = await api.get('/dashboard/sanction/applications');
      setApps(res.data.applications);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/dashboard/sanction/applications/${id}/approve`);
      setApps((prev) => prev.filter((a) => a._id !== id));
    } catch { /* handled */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectId || rejectReason.length < 5) return;
    setActionLoading(rejectId);
    try {
      await api.patch(`/dashboard/sanction/applications/${rejectId}/reject`, { rejectionReason: rejectReason });
      setApps((prev) => prev.filter((a) => a._id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch { /* handled */ }
    finally { setActionLoading(null); }
  };

  // Build salary slip download URL
  const getSlipUrl = (path: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    return `${base}${path}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--accent-primary)' }}>Sanction Review</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Evaluate and approve loan applications
          </p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {apps.length} Pending Review
        </div>
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27, 77, 62, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--danger)' }}>Reject Application</h3>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Reason for Rejection</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a clear reason (min 5 chars)..." rows={4} style={{ marginBottom: '1.5rem', resize: 'none' }} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn-danger" onClick={handleReject} disabled={rejectReason.length < 5 || actionLoading === rejectId}>
                {actionLoading === rejectId ? <><span className="spinner" /> Rejecting...</> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
      ) : apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }}>✅</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>All caught up!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>No pending applications to review right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {apps.map((app) => (
            <div key={app._id} className="card" style={{ padding: '1.5rem 1.75rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>{app.borrower.fullName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {app.borrower.email} <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>|</span> PAN: <span style={{ fontFamily: 'monospace' }}>{app.borrower.pan}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(app.loanAmount)}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{app.tenureDays} days tenure</div>
                </div>
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Salary</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatCurrency(app.borrower.monthlySalary)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employment</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginTop: '0.25rem', textTransform: 'capitalize' }}>{app.borrower.employmentMode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interest (12% p.a.)</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatCurrency(app.simpleInterest)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repayment</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--accent-primary)' }}>{formatCurrency(app.totalRepayment)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied On</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginTop: '0.25rem' }}>{formatDate(app.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salary Slip</div>
                  <a
                    href={getSlipUrl(app.salarySlipUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--info)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    📄 View Document
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                <button className="btn-outline" style={{ color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.3)' }} onClick={() => setRejectId(app._id)} disabled={actionLoading === app._id}>
                  Reject
                </button>
                <button className="btn-primary" onClick={() => handleApprove(app._id)} disabled={actionLoading === app._id}>
                  {actionLoading === app._id ? <><span className="spinner" /> Processing...</> : 'Approve & Sanction ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
