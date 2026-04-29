'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const STEPS = ['Personal Details', 'Salary Slip', 'Apply Loan'];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedName, setUploadedName] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('salarySlip', file);

      const res = await api.post('/borrower/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedName(res.data.file.originalName);
      setUploaded(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selected.type)) {
      setError('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5 MB.');
      return;
    }

    setError('');
    setFile(selected);
  };

  const activeStep = 1;

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="topnav">
        <div className="topnav-logo">CreditSea</div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Step 2 of 3</span>
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Upload Salary Slip</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
            Upload your latest salary slip as proof of income. Accepted formats: PDF, JPG, PNG (max 5 MB).
          </p>

          {!uploaded ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && <div className="error-box">{error}</div>}

              <div
                style={{
                  border: `2px dashed ${file ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: '0.5rem',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  background: file ? 'var(--accent-glow)' : '#ffffff',
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>📁</div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Click to upload</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      PDF, JPG, or PNG — max 5 MB
                    </p>
                  </>
                )}
              </div>

              <button id="upload-submit" type="submit" className="btn-primary" disabled={!file || loading} style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? <><span className="spinner" /> Uploading...</> : 'Upload & Continue →'}
              </button>
            </form>
          ) : (
            <div>
              <div className="success-box" style={{ marginBottom: '1.25rem' }}>
                ✓ Salary slip uploaded successfully: <strong>{uploadedName}</strong>
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => router.push('/borrower/apply')}>
                Continue to Loan Application →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
