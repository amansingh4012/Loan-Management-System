'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const STEPS = ['Personal Details', 'Salary Slip', 'Apply Loan'];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [employmentMode, setEmploymentMode] = useState('salaried');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors([]);
    setLoading(true);

    try {
      await api.put('/borrower/profile', {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode,
      });
      await refreshUser();
      router.push('/borrower/upload');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setErrors(data.errors.map((e: any) => e.message || e));
      } else {
        setError(data?.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const activeStep = 0;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Nav */}
      <div className="topnav">
        <div className="topnav-logo">CreditSea</div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user.email}</span>
      </div>

      <div style={{ maxWidth: 520, margin: '3rem auto', padding: '0 1rem' }}>
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Personal Details</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
            We&apos;ll verify your eligibility based on these details.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {error && <div className="error-box">{error}</div>}
            {errors.length > 0 && (
              <div className="error-box">
                <strong style={{ display: 'block', marginBottom: '0.375rem' }}>Eligibility check failed:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input id="profile-fullname" type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                PAN Number
              </label>
              <input id="profile-pan" type="text" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} required style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Date of Birth
              </label>
              <input id="profile-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Monthly Salary (₹)
              </label>
              <input id="profile-salary" type="number" placeholder="e.g., 50000" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} min={0} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                Employment Mode
              </label>
              <select id="profile-employment" value={employmentMode} onChange={(e) => setEmploymentMode(e.target.value)} required>
                <option value="salaried">Salaried</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>

            <button id="profile-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}>
              {loading ? <><span className="spinner" /> Checking eligibility...</> : 'Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
