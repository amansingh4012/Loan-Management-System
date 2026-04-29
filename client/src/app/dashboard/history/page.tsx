'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate, ACTION_CONFIG } from '@/lib/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityLog {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    fullName?: string;
    email: string;
    role: string;
  } | null;
  targetLoan?: {
    _id: string;
    loanAmount: number;
    status: string;
    totalRepayment: number;
  } | null;
  targetUser?: {
    _id: string;
    fullName?: string;
    email: string;
  } | null;
  metadata: Record<string, any>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'LOAN_APPLIED', label: 'Loan Applied' },
  { value: 'LOAN_SANCTIONED', label: 'Loan Sanctioned' },
  { value: 'LOAN_REJECTED', label: 'Loan Rejected' },
  { value: 'LOAN_DISBURSED', label: 'Loan Disbursed' },
  { value: 'PAYMENT_RECORDED', label: 'Payment Recorded' },
  { value: 'LOAN_CLOSED', label: 'Loan Closed' },
];

// ── Relative Time Helper ──────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(dateStr);
}

// ── Metadata Renderer ─────────────────────────────────────────────────────────

function renderMetadata(action: string, metadata: Record<string, any>): React.ReactNode {
  const items: string[] = [];

  if (metadata.loanAmount) items.push(`Amount: ${formatCurrency(metadata.loanAmount)}`);
  if (metadata.totalRepayment) items.push(`Repayment: ${formatCurrency(metadata.totalRepayment)}`);
  if (metadata.tenureDays) items.push(`Tenure: ${metadata.tenureDays} days`);
  if (metadata.amount) items.push(`Paid: ${formatCurrency(metadata.amount)}`);
  if (metadata.utrNumber) items.push(`UTR: ${metadata.utrNumber}`);
  if (metadata.rejectionReason) items.push(`Reason: ${metadata.rejectionReason}`);

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            background: 'var(--bg-secondary)',
            padding: '0.25rem 0.625rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontFamily: item.startsWith('UTR:') ? 'monospace' : 'inherit',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/admin/history', { params });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--accent-primary)' }}>Activity History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Complete audit trail of all system actions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {pagination && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {pagination.totalCount} {pagination.totalCount === 1 ? 'Entry' : 'Entries'}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          Filter by Action
        </label>
        <select
          id="history-action-filter"
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ maxWidth: 240, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }}>🕓</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No activity recorded yet.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Actions will appear here as the system is used.
          </p>
        </div>
      ) : (
        <>
          {/* Activity Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || { label: log.action, icon: '📌', badgeClass: 'badge-closed' };
              const performer = log.performedBy;
              const borrower = log.targetUser;

              return (
                <div key={log._id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                    {/* Left: Action details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.125rem' }}>{config.icon}</span>
                        <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                        {performer && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            by <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{performer.fullName || performer.email.split('@')[0]}</strong>
                            <span style={{
                              fontSize: '0.6875rem',
                              color: 'var(--accent-primary)',
                              background: 'var(--accent-glow)',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              marginLeft: '0.375rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}>
                              {performer.role}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Borrower / Target info */}
                      {borrower && borrower._id !== performer?._id && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Borrower: <strong style={{ color: 'var(--text-primary)' }}>{borrower.fullName || borrower.email}</strong>
                        </div>
                      )}

                      {/* Loan reference */}
                      {log.targetLoan && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          Loan: {formatCurrency(log.targetLoan.loanAmount)}
                          <span style={{ opacity: 0.4, margin: '0 0.375rem' }}>|</span>
                          Total: {formatCurrency(log.targetLoan.totalRepayment)}
                        </div>
                      )}

                      {/* Metadata chips */}
                      {renderMetadata(log.action, log.metadata)}
                    </div>

                    {/* Right: Timestamp */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {timeAgo(log.createdAt)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
            }}>
              <button
                className="btn-outline"
                style={{ padding: '0.5rem 1.25rem' }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn-outline"
                style={{ padding: '0.5rem 1.25rem' }}
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
