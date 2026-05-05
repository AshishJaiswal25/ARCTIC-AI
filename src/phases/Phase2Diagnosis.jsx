import PartsLookup from '../components/PartsLookup.jsx';
import { SEVERITY_CONFIG } from '../constants.js';

const cardStyle = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
  borderRadius: 16, padding: 24, marginBottom: 16,
};

const sectionLabel = {
  margin: '0 0 12px', fontSize: 13, fontWeight: 600,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
};

export default function Phase2Diagnosis({ diagnosis, photos, onBack, onProceed }) {
  const sev = SEVERITY_CONFIG[diagnosis.severity] || SEVERITY_CONFIG.medium;

  // Photo-derived insights
  const photoInsights = (photos || []).filter(p => p.analysis?.diagnostic_relevance);

  return (
    <>
      {/* Primary fault */}
      <div style={{ ...cardStyle, borderColor: sev.color, borderWidth: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 20, background: `${sev.color}22`, color: sev.color }}>
                {sev.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                {diagnosis.confidence}% confidence
              </span>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{diagnosis.primary_fault}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{diagnosis.explanation}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: sev.color }}>
              {diagnosis.confidence}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>confidence</div>
          </div>
        </div>
      </div>

      {/* Safety warnings */}
      {diagnosis.safety_warnings?.length > 0 && (
        <div style={{ ...cardStyle, background: 'rgba(234,88,12,0.08)', borderColor: 'rgba(249,115,22,0.3)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#fb923c' }}>Safety Warnings</p>
              {diagnosis.safety_warnings.map((w, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: 13, color: '#fdba74' }}>• {w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo insights from vision analysis */}
      {photoInsights.length > 0 && (
        <div style={{ ...cardStyle, background: 'rgba(14,165,233,0.08)', borderColor: 'rgba(14,165,233,0.3)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>📸 Photo Analysis Insights</p>
          {photoInsights.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < photoInsights.length - 1 ? 10 : 0 }}>
              <img src={p.dataUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: '#7dd3fc' }}>{p.analysis.component}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#38bdf8', lineHeight: 1.5 }}>{p.analysis.diagnostic_relevance}</p>
                {p.analysis.recommended_action && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#38bdf8', fontWeight: 500 }}>→ {p.analysis.recommended_action}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action + Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={sectionLabel}>Immediate Action</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{diagnosis.immediate_action}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={sectionLabel}>Tools Required</h3>
          {diagnosis.tools_needed?.map((t, i) => (
            <p key={i} style={{ margin: '3px 0', fontSize: 13, color: 'var(--text-secondary)' }}>• {t}</p>
          ))}
          {diagnosis.estimated_repair_time && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--border-primary)', paddingTop: 8 }}>
              Est. time: <strong style={{ color: 'var(--text-secondary)' }}>{diagnosis.estimated_repair_time}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Differentials */}
      {diagnosis.differential_diagnoses?.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionLabel}>Differential Diagnoses</h3>
          {diagnosis.differential_diagnoses.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < diagnosis.differential_diagnoses.length - 1 ? '1px solid var(--bg-tertiary)' : 'none' }}>
              <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ width: `${d.probability}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent)', minWidth: 36 }}>
                {d.probability}%
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{d.fault}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>Rule out: {d.rule_out}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parts lookup */}
      {diagnosis.parts_likely_needed?.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionLabel}>Parts & Pricing</h3>
          <PartsLookup initialParts={diagnosis.parts_likely_needed} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onBack} style={{
          background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)',
          borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>← Edit Intake</button>
        <button onClick={onProceed} style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: '#fff', border: 'none',
          borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 20px var(--accent-shadow)',
        }}>Chat Guidance →</button>
      </div>
    </>
  );
}
