import { useState, useEffect } from 'react';
import { getJobs, updateJobStatus, isBackendAvailable } from '../db/s3-api.js';
import { getLocalJobs } from '../db/indexedDB.js';

const STATUS_COLORS = {
  open:       { bg: '#fff7ed', color: '#ea580c', label: 'Open' },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', label: 'In Progress' },
  completed:  { bg: '#f0fdf4', color: '#16a34a', label: 'Completed' },
  warranty:   { bg: '#faf5ff', color: '#7c3aed', label: 'Under Warranty' },
};

export default function JobHistory({ onLoadJob, onClose }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      if (await isBackendAvailable()) {
        const data = await getJobs();
        setJobs(data || []);
        setSource('cloud');
      } else {
        const local = await getLocalJobs();
        setJobs(local);
        setSource('local');
      }
    } catch (e) {
      setError(e.message);
      // Fallback to local
      const local = await getLocalJobs();
      setJobs(local);
      setSource('local');
    }
    setLoading(false);
  };

  const changeStatus = async (id, status) => {
    try {
      if (await isBackendAvailable()) await updateJobStatus(id, status);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, job_status: status } : j));
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  const filtered = jobs.filter(j => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.customer_name?.toLowerCase().includes(q) ||
      j.customer_address?.toLowerCase().includes(q) ||
      j.equipment_type?.toLowerCase().includes(q) ||
      j.brand?.toLowerCase().includes(q) ||
      j.diagnosis?.primary_fault?.toLowerCase().includes(q)
    );
  });

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: 0 }}>←</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Job History</h2>
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
          background: source === 'cloud' ? 'rgba(37,99,235,0.15)' : 'rgba(22,163,74,0.15)',
          color: source === 'cloud' ? '#60a5fa' : '#4ade80',
          border: `1px solid ${source === 'cloud' ? 'rgba(37,99,235,0.3)' : 'rgba(22,163,74,0.3)'}`,
        }}>
          {source === 'cloud' ? '☁️ Cloud' : '💾 Local'}
        </span>
        <button onClick={loadJobs} style={{ marginLeft: 'auto', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 10, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Refresh
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by customer, address, brand, fault…"
        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-secondary)', borderRadius: 12, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
      />

      {source === 'local' && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--warning)' }}>
          Showing local jobs - start the backend server for cloud storage
        </div>
      )}

      {error && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 8 }}>⚠️ {error}</p>}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 14 }}>Loading jobs…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 14 }}>
          {jobs.length === 0 ? 'No jobs yet. Complete your first job to see it here.' : 'No jobs match your search.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => {
            const status = job.job_status || 'open';
            const sc = STATUS_COLORS[status] || STATUS_COLORS.open;
            const diagnosis = job.diagnosis || {};

            return (
              <div key={job.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${sc.color}22`, color: sc.color }}>{sc.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(job.created_at)}</span>
                    </div>

                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {job.customer_name || 'Unknown Customer'}
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {job.customer_address || 'No address'} · {job.equipment_type} {job.brand}
                    </p>

                    {diagnosis.primary_fault && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                        ⚡ {diagnosis.primary_fault}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => onLoadJob(job)} style={{
                      background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none',
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>View</button>
                    <select
                      value={status}
                      onChange={e => changeStatus(job.id, e.target.value)}
                      style={{ padding: '4px 6px', border: '1px solid var(--border-secondary)', borderRadius: 8, fontSize: 11, background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="warranty">Warranty</option>
                    </select>
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
