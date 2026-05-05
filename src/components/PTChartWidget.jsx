import { useState } from 'react';
import { PT_CHARTS, pressureToTemp, tempToPressure } from '../data/pt-charts.js';

export default function PTChartWidget({ defaultRefrigerant = 'R-410A' }) {
  const [refrigerant, setRefrigerant] = useState(defaultRefrigerant);
  const [mode, setMode] = useState('p2t'); // 'p2t' or 't2p'
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const num = parseFloat(inputVal);
    if (isNaN(num)) return;
    if (mode === 'p2t') {
      const temp = pressureToTemp(refrigerant, num);
      setResult(temp !== null ? `${temp} °F` : 'Out of range');
    } else {
      const pres = tempToPressure(refrigerant, num);
      setResult(pres !== null ? `${pres} psig` : 'Out of range');
    }
  };

  const chart = PT_CHARTS[refrigerant];

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-primary)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>📊</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>P/T Chart</h3>
        <span style={{ fontSize: 11, background: 'var(--success-bg)', color: 'var(--success-dark)', border: '1px solid var(--success-border)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>OFFLINE</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={refrigerant}
          onChange={e => { setRefrigerant(e.target.value); setResult(null); }}
          style={{ padding: '6px 10px', border: '1.5px solid var(--border-primary)', borderRadius: 8, fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-primary)' }}
        >
          {Object.keys(PT_CHARTS).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <div style={{ display: 'flex', border: '1.5px solid var(--border-primary)', borderRadius: 8, overflow: 'hidden' }}>
          {[['p2t', 'psig → °F'], ['t2p', '°F → psig']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === m ? 'var(--accent)' : 'var(--bg-secondary)',
              color: mode === m ? '#fff' : 'var(--text-muted)',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
          placeholder={mode === 'p2t' ? 'Enter pressure (psig)' : 'Enter temp (°F)'}
          style={{
            flex: 1, padding: '8px 12px', border: '1.5px solid var(--border-primary)',
            borderRadius: 8, fontSize: 14, fontFamily: 'monospace', outline: 'none',
            background: 'var(--bg-input)', color: 'var(--text-primary)',
          }}
        />
        <button onClick={calculate} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Calc</button>
      </div>

      {result && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {chart?.name} @ {inputVal} {mode === 'p2t' ? 'psig' : '°F'}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
            {result}
          </span>
        </div>
      )}

      {/* Quick reference table - last 8 rows of chart */}
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          Quick reference table
        </summary>
        <div style={{ marginTop: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Temp °F</th>
                <th style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Pressure psig</th>
              </tr>
            </thead>
            <tbody>
              {(chart?.data || []).filter((_, i) => i % 2 === 0).map(([t, p]) => (
                <tr key={t}>
                  <td style={{ padding: '3px 8px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{t}</td>
                  <td style={{ padding: '3px 8px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
