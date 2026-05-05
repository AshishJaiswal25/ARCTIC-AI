import { useEffect } from 'react';

export default function VoiceButton({ isListening, onStart, onStop, isSupported, label = 'Voice', size = 'normal' }) {
  useEffect(() => {
    return () => { if (isListening) onStop?.(); };
  }, []);

  if (!isSupported) return null;

  const small = size === 'small';

  return (
    <button
      onClick={isListening ? onStop : onStart}
      title={isListening ? 'Stop recording' : `${label} input`}
      style={{
        display: 'flex', alignItems: 'center', gap: small ? 4 : 6,
        padding: small ? '6px 10px' : '8px 14px',
        background: isListening ? 'var(--error-bg)' : 'var(--bg-tertiary)',
        border: `1.5px solid ${isListening ? 'var(--error-border)' : 'var(--border-primary)'}`,
        borderRadius: 8, cursor: 'pointer',
        fontSize: small ? 12 : 13, fontWeight: 600,
        color: isListening ? 'var(--error)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {isListening ? (
        <>
          <span style={{
            width: small ? 7 : 9, height: small ? 7 : 9,
            borderRadius: '50%', background: '#dc2626',
            animation: 'pulse 1s infinite',
          }} />
          Stop
        </>
      ) : (
        <>
          <span style={{ fontSize: small ? 12 : 14 }}>🎙️</span>
          {label}
        </>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </button>
  );
}
