import { useEffect } from 'react';

export default function VoiceButton({ isListening, isTranscribing, onStart, onStop, isSupported, label = 'Voice', size = 'normal' }) {
  useEffect(() => {
    return () => { if (isListening) onStop?.(); };
  }, []);

  if (!isSupported) return null;

  const small = size === 'small';

  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={isTranscribing}
      title={isListening ? 'Stop recording' : isTranscribing ? 'Transcribing…' : `${label} input`}
      style={{
        display: 'flex', alignItems: 'center', gap: small ? 4 : 6,
        padding: small ? '6px 10px' : '8px 14px',
        background: isListening ? 'var(--error-bg)' : isTranscribing ? 'var(--warning-bg)' : 'var(--bg-tertiary)',
        border: `1.5px solid ${isListening ? 'var(--error-border)' : isTranscribing ? 'var(--warning-border)' : 'var(--border-primary)'}`,
        borderRadius: 8, cursor: isTranscribing ? 'default' : 'pointer',
        fontSize: small ? 12 : 13, fontWeight: 600,
        color: isListening ? 'var(--error)' : isTranscribing ? 'var(--warning)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        opacity: isTranscribing ? 0.8 : 1,
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
      ) : isTranscribing ? (
        <>
          <span style={{ animation: 'pulse 1s infinite' }}>⏳</span>
          Transcribing…
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
