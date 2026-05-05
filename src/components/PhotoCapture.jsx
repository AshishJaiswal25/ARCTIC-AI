import { useState, useRef } from 'react';
import { analyzePhoto } from '../api.js';

export default function PhotoCapture({ photos, onPhotosChange }) {
  const [analyzing, setAnalyzing] = useState(null);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type;
        const id = Date.now() + Math.random();

        const newPhoto = { id, dataUrl, base64, mimeType, name: file.name, analysis: null, analyzing: true };
        onPhotosChange(prev => [...prev, newPhoto]);

        setAnalyzing(id);
        try {
          const analysis = await analyzePhoto(base64, mimeType);
          onPhotosChange(prev =>
            prev.map(p => p.id === id ? { ...p, analysis, analyzing: false } : p)
          );
        } catch {
          onPhotosChange(prev =>
            prev.map(p => p.id === id ? { ...p, analyzing: false, error: 'Analysis failed' } : p)
          );
        }
        setAnalyzing(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (id) => onPhotosChange(prev => prev.filter(p => p.id !== id));

  const conditionColor = (c) => ({ good: '#22c55e', fair: '#f59e0b', poor: '#ef4444', unknown: '#94a3b8' }[c] || '#94a3b8');

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed var(--border-secondary)', borderRadius: 12, padding: '20px 16px',
          textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Tap to add photos or drag & drop
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Nameplates, capacitors, wiring, fault codes - AI analyzes each
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{
              border: '1.5px solid var(--border-primary)', borderRadius: 12,
              overflow: 'hidden', background: 'var(--bg-secondary)',
            }}>
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <img src={photo.dataUrl} alt={photo.name} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => removePhoto(photo.id)}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    width: 22, height: 22, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
                {photo.analyzing && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12,
                  }}>
                    Analyzing…
                  </div>
                )}
              </div>

              {/* Analysis */}
              <div style={{ padding: '10px 10px 12px' }}>
                {photo.analysis ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: conditionColor(photo.analysis.condition), flexShrink: 0,
                      }} />
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {photo.analysis.component}
                      </p>
                    </div>

                    {Object.keys(photo.analysis.extracted_values || {}).length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        {Object.entries(photo.analysis.extracted_values).slice(0, 3).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                            <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {photo.analysis.condition_notes && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {photo.analysis.condition_notes.slice(0, 80)}…
                      </p>
                    )}
                  </>
                ) : photo.error ? (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--error)' }}>Analysis failed</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Processing…</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
