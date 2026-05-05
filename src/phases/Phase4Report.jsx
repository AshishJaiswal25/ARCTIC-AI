import { useState } from 'react';
import { saveJob, saveFeedback, isBackendAvailable } from '../db/s3-api.js';
import { saveJobLocally, addToSyncQueue } from '../db/indexedDB.js';

export default function Phase4Report({
  jobId, diagnosis, equipType, brand, modelNum, refrigerant,
  symptoms, readings, techNotes, photos, faultCode,
  onBack, onNewJob,
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [techName, setTechName] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Feedback state
  const [feedbackAnswer, setFeedbackAnswer] = useState(null); // null | 'yes' | 'no' | 'partial'
  const [actualDiagnosis, setActualDiagnosis] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const ref = jobId || `ARCTIC-${Date.now().toString(36).toUpperCase()}`;

  const warrantyUntil = warrantyMonths
    ? new Date(Date.now() + parseInt(warrantyMonths) * 30 * 86400000).toISOString().split('T')[0]
    : null;

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const job = {
      id: ref,
      techId: techName || 'default',
      techName,
      customerName,
      customerAddress,
      equipType, brand, modelNum, refrigerant,
      symptoms, readings, techNotes, faultCode,
      diagnosis,
      warrantyUntil,
      status: 'completed',
      createdAt: Date.now(),
    };

    try {
      if (await isBackendAvailable()) {
        await saveJob(job);
        setSaveMsg('Saved to cloud ☁️');
      } else {
        await saveJobLocally(job);
        await addToSyncQueue(job);
        setSaveMsg('Saved locally - start backend server to sync to S3');
      }
      setSaved(true);
    } catch (e) {
      // Fallback to local
      await saveJobLocally(job).catch(() => {});
      setSaveMsg(`Cloud save failed - saved locally. ${e.message}`);
      setSaved(true);
    }
    setSaving(false);
  };

  const handleFeedbackSubmit = async () => {
    setFeedbackSaving(true);
    setFeedbackMsg('');
    const feedback = {
      id: `fb-${ref}-${Date.now()}`,
      jobId: ref,
      timestamp: new Date().toISOString(),
      // Input data (what the model saw)
      input: {
        equipType,
        brand: brand || 'Unknown',
        modelNum: modelNum || 'Unknown',
        refrigerant: refrigerant || 'Unknown',
        faultCode: faultCode || 'None',
        symptoms,
        readings,
        techNotes: techNotes || '',
      },
      // AI output
      aiDiagnosis: {
        primaryFault: diagnosis.primary_fault,
        severity: diagnosis.severity,
        confidence: diagnosis.confidence,
        explanation: diagnosis.explanation,
        immediateAction: diagnosis.immediate_action,
        differentialDiagnoses: diagnosis.differential_diagnoses,
        partsNeeded: diagnosis.parts_likely_needed,
        safetyWarnings: diagnosis.safety_warnings,
      },
      // Technician feedback
      feedback: {
        wasCorrect: feedbackAnswer,       // 'yes' | 'no' | 'partial'
        actualDiagnosis: feedbackAnswer !== 'yes' ? actualDiagnosis : '',
        techNotes: feedbackNotes,
        techName: techName || 'Unknown',
      },
    };

    try {
      if (await isBackendAvailable()) {
        await saveFeedback(feedback);
        setFeedbackMsg('Feedback saved to S3 ☁️');
      } else {
        setFeedbackMsg('Backend offline - feedback not saved');
      }
      setFeedbackSaved(true);
    } catch (e) {
      setFeedbackMsg(`Failed to save feedback: ${e.message}`);
    }
    setFeedbackSaving(false);
  };

  const filledReadings = Object.entries(readings).filter(([, v]) => v);

  const inp = {
    padding: '10px 14px', border: '1px solid var(--border-secondary)', borderRadius: 10,
    fontSize: 14, outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
    width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', color: 'var(--text-primary)',
  };

  const secLabel = { margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 16, padding: 24 }}>
      {/* Report header */}
      <div style={{ borderBottom: '2px solid var(--border-secondary)', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>❄️</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>HVAC Service Report</h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>REF: {ref}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-dim)' }}>
          <p style={{ margin: 0 }}>{date}</p>
          <p style={{ margin: 0 }}>{time}</p>
        </div>
      </div>

      {/* Customer + Tech info */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--border-primary)' }}>
        <p style={{ ...secLabel, marginBottom: 12 }}>Job Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Customer Name</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Jane Smith" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Technician Name</label>
            <input value={techName} onChange={e => setTechName(e.target.value)} placeholder="Your name" style={inp} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Service Address</label>
            <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 Main St, Portland, ME" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Warranty Period</label>
            <select value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} style={inp}>
              <option value="">No warranty</option>
              <option value="1">30 days</option>
              <option value="3">90 days</option>
              <option value="6">6 months</option>
              <option value="12">1 year</option>
              <option value="24">2 years</option>
            </select>
          </div>
          {warrantyUntil && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#7c3aed', fontWeight: 500 }}>
                🔒 Warranty expires: {new Date(warrantyUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment + Diagnosis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <p style={secLabel}>Equipment</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{equipType}</p>
          <p style={{ margin: '2px 0', fontSize: 13, color: 'var(--text-muted)' }}>{brand} {modelNum}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Refrigerant: {refrigerant || 'Unknown'}</p>
          {faultCode && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>Fault code: {faultCode}</p>}
        </div>
        <div>
          <p style={secLabel}>Diagnosis</p>
          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{diagnosis.primary_fault}</p>
          <p style={{ margin: '2px 0', fontSize: 13, color: 'var(--text-muted)' }}>Severity: {diagnosis.severity?.toUpperCase()} · {diagnosis.confidence}% confidence</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Est. repair: {diagnosis.estimated_repair_time}</p>
        </div>
      </div>

      {/* Readings */}
      {filledReadings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={secLabel}>Readings</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {filledReadings.map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '8px 10px', border: '1px solid var(--border-primary)' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptoms */}
      <div style={{ marginBottom: 20 }}>
        <p style={secLabel}>Symptoms Reported</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{symptoms.join(' · ')}</p>
      </div>

      {/* Findings */}
      <div style={{ marginBottom: 20 }}>
        <p style={secLabel}>Technical Findings</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{diagnosis.explanation}</p>
      </div>

      {/* Parts */}
      <div style={{ marginBottom: 20 }}>
        <p style={secLabel}>Parts Required</p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{diagnosis.parts_likely_needed?.join(', ') || 'TBD'}</p>
      </div>

      {/* Safety notes */}
      {diagnosis.safety_warnings?.length > 0 && (
        <div style={{ marginBottom: 20, padding: 14, background: 'var(--warning-bg)', borderRadius: 12, border: '1px solid var(--warning-border)' }}>
          <p style={{ ...secLabel, color: 'var(--warning)', marginBottom: 6 }}>Safety Notes</p>
          {diagnosis.safety_warnings.map((w, i) => (
            <p key={i} style={{ margin: '2px 0', fontSize: 13, color: 'var(--warning)' }}>• {w}</p>
          ))}
        </div>
      )}

      {/* Photos in report */}
      {photos?.filter(p => p.analysis).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={secLabel}>Photo Documentation</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {photos.filter(p => p.analysis).map(p => (
              <div key={p.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
                <img src={p.dataUrl} alt={p.analysis?.component} style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }} />
                <p style={{ margin: 0, padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>{p.analysis?.component}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech notes */}
      {techNotes && (
        <div style={{ marginBottom: 20 }}>
          <p style={secLabel}>Technician Notes</p>
          <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: 'var(--text-secondary)' }}>{techNotes}</p>
        </div>
      )}

      {/* ── Diagnosis Feedback (fine-tuning data) ─────────────────────────────── */}
      <div style={{
        marginBottom: 20, padding: 20,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(249,115,22,0.06))',
        borderRadius: 14, border: '1px solid rgba(124,58,237,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#c4b5fd' }}>Was the AI diagnosis correct?</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8b5cf6' }}>Your feedback helps improve future diagnoses</p>
          </div>
        </div>

        {!feedbackSaved ? (
          <>
            {/* Yes / Partial / No buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {[
                { value: 'yes', label: '✓ Yes, correct', color: '#4ade80', bg: 'rgba(22,163,74,0.15)', border: 'rgba(22,163,74,0.4)' },
                { value: 'partial', label: '◐ Partially', color: '#facc15', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)' },
                { value: 'no', label: '✗ No, wrong', color: '#f87171', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFeedbackAnswer(opt.value)}
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: feedbackAnswer === opt.value ? opt.bg : 'var(--bg-tertiary)',
                    color: feedbackAnswer === opt.value ? opt.color : 'var(--text-muted)',
                    border: `2px solid ${feedbackAnswer === opt.value ? opt.border : 'var(--border-secondary)'}`,
                    boxShadow: feedbackAnswer === opt.value ? `0 0 12px ${opt.bg}` : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* If not correct - show actual diagnosis field */}
            {(feedbackAnswer === 'no' || feedbackAnswer === 'partial') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#a78bfa', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  What was the actual diagnosis?
                </label>
                <input
                  value={actualDiagnosis}
                  onChange={e => setActualDiagnosis(e.target.value)}
                  placeholder="e.g., Bad run capacitor, not compressor failure"
                  style={{ ...inp, borderColor: '#7c3aed33' }}
                />
              </div>
            )}

            {/* Optional notes */}
            {feedbackAnswer && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#a78bfa', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Additional notes (optional)
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  placeholder="Any details about what worked, what didn't, or what the actual issue was..."
                  rows={3}
                  style={{
                    ...inp, resize: 'vertical', minHeight: 60,
                    borderColor: '#7c3aed33', lineHeight: 1.5,
                  }}
                />
              </div>
            )}

            {/* Submit feedback */}
            {feedbackAnswer && (
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSaving || (feedbackAnswer !== 'yes' && !actualDiagnosis.trim())}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  cursor: feedbackSaving ? 'default' : 'pointer',
                  opacity: feedbackSaving || (feedbackAnswer !== 'yes' && !actualDiagnosis.trim()) ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {feedbackSaving ? 'Saving feedback…' : '📤 Submit Feedback'}
              </button>
            )}

            {feedbackMsg && !feedbackSaved && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f87171' }}>{feedbackMsg}</p>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(22,163,74,0.1)', borderRadius: 10, border: '1px solid rgba(22,163,74,0.25)' }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{feedbackMsg}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#22c55e' }}>
                This data will be used to improve AI diagnosis accuracy
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save + actions */}
      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          {saved ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>✓ {saveMsg}</p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>
              Save to cloud for job history & warranty tracking
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Print / PDF
          </button>
          {!saved && (
            <button onClick={handleSave} disabled={saving} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              {saving ? 'Saving…' : '💾 Save Job'}
            </button>
          )}
          <button onClick={onBack} style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 12, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Back
          </button>
          <button onClick={onNewJob} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            New Job
          </button>
        </div>
      </div>
    </div>
  );
}
