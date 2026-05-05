import { useState } from 'react';
import { FAULT_CODES, lookupFaultCode, SUPPORTED_BRANDS } from '../data/fault-codes.js';

export default function FaultCodeSearch({ brand = '' }) {
  const [selectedBrand, setSelectedBrand] = useState(brand);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!selectedBrand || !query.trim()) return;
    const result = lookupFaultCode(selectedBrand, query.trim());
    setFound(result);
    setSearched(true);
  };

  // Browse all codes for selected brand
  const allCodes = selectedBrand ? (FAULT_CODES[selectedBrand]?.codes || []) : [];
  const filtered = query.length > 1 && !searched
    ? allCodes.filter(c =>
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <select
          value={selectedBrand}
          onChange={e => { setSelectedBrand(e.target.value); setFound(null); setSearched(false); }}
          style={{ padding: '7px 10px', border: '1.5px solid var(--border-primary)', borderRadius: 8, fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-primary)', minWidth: 140 }}
        >
          <option value="">Select brand</option>
          {SUPPORTED_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSearched(false); setFound(null); }}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Code (e.g. E4) or description"
          style={{ flex: 1, minWidth: 140, padding: '7px 10px', border: '1.5px solid var(--border-primary)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
        />
        <button onClick={search} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Look up</button>
      </div>

      {/* Live filter results */}
      {filtered.length > 0 && (
        <div style={{ border: '1.5px solid var(--border-primary)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
          {filtered.slice(0, 5).map((c, i) => (
            <div key={c.code} onClick={() => { setFound(c); setSearched(true); setQuery(c.code); }}
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < 4 ? '1px solid var(--border-primary)' : 'none',
                background: 'var(--bg-secondary)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-primary)' }}>{c.code}</span>
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{c.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Exact match result */}
      {searched && (
        found ? (
          <div style={{ background: 'var(--bg-tertiary)', border: '1.5px solid var(--border-primary)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, background: 'var(--accent)', color: '#fff', padding: '3px 8px', borderRadius: 6 }}>
                {found.code}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{found.description}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔧</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{found.action}</p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
            Code "{query}" not found for {selectedBrand}. Try browsing below.
          </p>
        )
      )}

      {/* Browse all - collapsed */}
      {selectedBrand && allCodes.length > 0 && !filtered.length && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
            Browse all {selectedBrand} codes ({allCodes.length})
          </summary>
          <div style={{ marginTop: 8, maxHeight: 250, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 8 }}>
            {allCodes.map((c, i) => (
              <div key={c.code} style={{
                padding: '8px 12px', borderBottom: i < allCodes.length - 1 ? '1px solid var(--border-primary)' : 'none',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
                onClick={() => { setFound(c); setSearched(true); setQuery(c.code); }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, background: 'var(--bg-tertiary)', padding: '2px 5px', borderRadius: 4 }}>{c.code}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{c.description}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
