'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/constants';

interface Lead {
  _id: string;
  email: string;
  fullName?: string;
  profileCompleted: boolean;
  createdAt: string;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/sales/leads');
        setLeads(res.data.leads);
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--accent-primary)' }}>Sales Tracker</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Monitor registered users who haven&apos;t applied for a loan yet ({leads.length} active leads)
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
      ) : leads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No leads at the moment.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>All registered users have applied for a loan.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Lead Email</th>
                  <th>Full Name</th>
                  <th>Profile Status</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td style={{ fontWeight: 500 }}>{lead.email}</td>
                    <td>{lead.fullName || <span style={{ color: 'var(--text-secondary)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${lead.profileCompleted ? 'badge-sanctioned' : 'badge-applied'}`}>
                        {lead.profileCompleted ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
