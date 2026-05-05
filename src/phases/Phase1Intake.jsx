import { useState } from 'react';
import PhotoCapture from '../components/PhotoCapture.jsx';
import PTChartWidget from '../components/PTChartWidget.jsx';
import FaultCodeSearch from '../components/FaultCodeSearch.jsx';
import VoiceButton from '../components/VoiceButton.jsx';
import { useVoiceInput } from '../hooks/useVoiceInput.js';
import { EQUIPMENT_TYPES, SYMPTOM_OPTIONS, REFRIGERANT_TYPES, READING_LABELS } from '../constants.js';
import { SUPPORTED_BRANDS } from '../data/fault-codes.js';

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  display: 'block', marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border-secondary)', borderRadius: 10,
  fontSize: 14, background: 'var(--bg-input)', color: 'var(--text-primary)',
  outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const cardStyle = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
  borderRadius: 16, padding: 24, marginBottom: 16,
};

export default function Phase1Intake({
  equipType, setEquipType, brand, setBrand, modelNum, setModelNum,
  refrigerant, setRefrigerant, symptoms, toggleSymptom,
  readings, setReadings, techNotes, setTechNotes,
  photos, setPhotos, faultCode, setFaultCode,
  onSubmit, loading,
}) {
  const [activeTab, setActiveTab] = useState('intake'); // 'intake' | 'tools'
  const voice = useVoiceInput();
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const handleReadingsDictation = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      setVoiceTranscript('');
      voice.startReadingsDictation((updates) => {
        setReadings(prev => ({ ...prev, ...updates }));
        setVoiceTranscript(prev => prev + ' ' + JSON.stringify(updates));
      });
    }
  };

  const canSubmit = equipType && symptoms.length > 0;

  const allBrands = [...new Set([...SUPPORTED_BRANDS, 'Rheem', 'Goodman', 'American Standard', 'Heil', 'Bryant', 'Payne'])];

  return (
    <>
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: '1px solid var(--border-primary)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-primary)' }}>
        {[['intake', '📋 Job Intake'], ['tools', '🔧 Field Tools']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
            background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-dim)',
            fontSize: 14,
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'intake' && (
        <>
          {/* Equipment */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Equipment</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Equipment Type *</label>
                <select value={equipType} onChange={e => setEquipType(e.target.value)} style={{ ...inputStyle }}>
                  <option value="">Select type...</option>
                  {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Brand</label>
                <select value={brand} onChange={e => setBrand(e.target.value)} style={{ ...inputStyle }}>
                  <option value="">Select brand...</option>
                  {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Model / Serial</label>
                <input value={modelNum} onChange={e => setModelNum(e.target.value)} placeholder="e.g. 24ACC636A003" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Refrigerant Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {REFRIGERANT_TYPES.map(r => (
                    <button key={r} onClick={() => setRefrigerant(r)} style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid',
                      borderColor: refrigerant === r ? 'var(--accent)' : 'var(--border-secondary)',
                      background: refrigerant === r ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                      color: refrigerant === r ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Symptoms *</h2>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-dim)' }}>Select all that apply</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SYMPTOM_OPTIONS.map(s => (
                <div key={s} onClick={() => toggleSymptom(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  border: '1px solid', borderColor: symptoms.includes(s) ? 'var(--accent)' : 'var(--border-primary)',
                  borderRadius: 10, cursor: 'pointer',
                  background: symptoms.includes(s) ? 'var(--accent-bg-subtle)' : 'var(--bg-tertiary)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: symptoms.includes(s) ? 'var(--accent)' : 'transparent',
                    border: symptoms.includes(s) ? 'none' : '1.5px solid #444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {symptoms.includes(s) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: symptoms.includes(s) ? 'var(--accent-light)' : 'var(--text-secondary)', fontWeight: symptoms.includes(s) ? 500 : 400 }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Readings with voice */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Field Readings</h2>
              <VoiceButton
                isListening={voice.isListening}
                onStart={handleReadingsDictation}
                onStop={handleReadingsDictation}
                isSupported={voice.isSupported}
                label="Dictate readings"
              />
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-dim)' }}>
              Leave blank if not yet taken. Use voice to dictate: "suction pressure 118, discharge 380"
            </p>

            {voice.isListening && (
              <div style={{ background: 'var(--accent-bg-subtle)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: 'var(--accent-light)' }}>
                🎙️ Listening… speak readings naturally, e.g. "suction 118, superheat 12, amps 14"
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Object.entries(READING_LABELS).map(([key, { label, unit, placeholder }]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid', borderRadius: 10, overflow: 'hidden', borderColor: readings[key] ? 'var(--accent)' : 'var(--border-secondary)', background: 'var(--bg-input)', transition: 'border-color 0.15s' }}>
                    <input
                      type="number"
                      value={readings[key]}
                      onChange={e => setReadings(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ border: 'none', outline: 'none', padding: '9px 10px', fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, width: '100%', background: 'transparent', color: 'var(--text-primary)' }}
                    />
                    <span style={{ padding: '0 10px', fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Fault Code (if displayed)</label>
              <input value={faultCode} onChange={e => setFaultCode(e.target.value)} placeholder="E4, 3 flash, etc." style={{ ...inputStyle, width: '50%' }} />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Tech Notes</label>
              <textarea value={techNotes} onChange={e => setTechNotes(e.target.value)}
                placeholder="Visual observations, error history, customer description..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Photos */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Photos</h2>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-dim)' }}>
              AI analyzes each photo - nameplates, capacitors, wiring, frost patterns
            </p>
            <PhotoCapture photos={photos} onPhotosChange={setPhotos} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button onClick={onSubmit} disabled={!canSubmit || loading} style={{
              background: canSubmit ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))' : 'var(--border-primary)',
              color: canSubmit ? '#fff' : 'var(--text-faint)',
              border: 'none', borderRadius: 12, padding: '13px 32px',
              fontSize: 15, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: canSubmit ? '0 4px 20px var(--accent-shadow)' : 'none',
            }}>
              {loading ? '⏳ Analyzing…' : 'Run AI Diagnosis →'}
            </button>
            {!canSubmit && (
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
                Select equipment type and at least one symptom
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === 'tools' && (
        <>
          {/* P/T Chart */}
          <div style={{ marginBottom: 16 }}>
            <PTChartWidget defaultRefrigerant={refrigerant || 'R-410A'} />
          </div>

          {/* Fault Code Search */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Fault Code Lookup</h3>
              <span style={{ fontSize: 11, background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>OFFLINE</span>
            </div>
            <FaultCodeSearch brand={brand} />
          </div>
        </>
      )}
    </>
  );
}
