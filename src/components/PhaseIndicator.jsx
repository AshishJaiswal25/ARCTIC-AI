export default function PhaseIndicator({ current, onNavigate, furthest }) {
  const phases = [
    { label: 'Intake', icon: '📋' },
    { label: 'Diagnosis', icon: '🔍' },
    { label: 'Guidance', icon: '💬' },
    { label: 'Report', icon: '📄' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 16,
      padding: '14px 20px', marginBottom: 24,
    }}>
      {phases.map((p, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        const canClick = onNavigate && num <= (furthest || current);

        return (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              onClick={() => canClick && onNavigate(num)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
                cursor: canClick ? 'pointer' : 'default',
                opacity: num > (furthest || current) ? 0.35 : 1,
                transition: 'all 0.2s ease',
              }}
              title={canClick ? `Go to ${p.label}` : ''}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: done ? 'var(--success-dark)' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                border: done || active ? 'none' : '1.5px solid var(--border-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 14 : 13, fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: done || active ? '#fff' : 'var(--text-dim)',
                transition: 'all 0.25s ease',
                boxShadow: active ? '0 0 20px var(--accent-shadow)' : 'none',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                fontSize: 10, marginTop: 6, fontWeight: active ? 600 : 500,
                color: active ? 'var(--accent)' : done ? 'var(--success-dark)' : 'var(--text-dim)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'all 0.2s ease',
              }}>{p.label}</span>
            </div>
            {i < 3 && (
              <div style={{
                height: 2, flex: 0.4,
                background: done ? 'var(--success-dark)' : 'var(--border-primary)',
                borderRadius: 1, marginBottom: 16,
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
