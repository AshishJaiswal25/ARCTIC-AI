import { useState, useRef, useEffect } from 'react';
import VoiceButton from '../components/VoiceButton.jsx';
import { useVoiceInput } from '../hooks/useVoiceInput.js';

export default function Phase3Chat({ diagnosis, equipType, chatHistory, onSend, loading, onGenerateReport }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const voice = useVoiceInput();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleVoice = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening((text) => setInput(text));
    }
  };

  const visibleMessages = chatHistory.slice(2);

  // Quick action prompts
  const quickPrompts = [
    'What are the exact test steps?',
    'What pressure should I expect after repair?',
    'How do I check the capacitor?',
    'Any brand-specific issues with this?',
    'Confirm parts needed',
  ];

  return (
    <>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bg-tertiary)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>ARCTIC</span>
          <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {equipType} - {diagnosis?.primary_fault}
          </span>
        </div>

        {/* Messages */}
        <div style={{ height: 400, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', maxWidth: '88%', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent)' }}>ARCTIC:</strong> Diagnosis locked in - <strong style={{ color: 'var(--text-primary)' }}>{diagnosis?.primary_fault}</strong>. Ask me anything: test steps, pressure targets, wiring checks, or edge cases you're seeing on the unit.
          </div>

          {visibleMessages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))' : 'var(--bg-tertiary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
                borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                padding: '12px 16px', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              }}>
                {msg.role === 'assistant' && <strong style={{ color: 'var(--accent)' }}>ARCTIC: </strong>}
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', maxWidth: '88%' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>ARCTIC is thinking…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--bg-tertiary)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {quickPrompts.map(p => (
            <button key={p} onClick={() => { setInput(p); }} style={{
              padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
              borderRadius: 20, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
              color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 0.15s',
            }}>{p}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bg-tertiary)', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask follow-up…"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-secondary)', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: "'Inter', system-ui, sans-serif", background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
          <VoiceButton isListening={voice.isListening} onStart={handleVoice} onStop={handleVoice} isSupported={voice.isSupported} label="Voice" size="small" />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: '#fff', border: 'none',
            borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1, transition: 'opacity 0.15s',
          }}>Send</button>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button onClick={onGenerateReport} style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: '#fff', border: 'none',
          borderRadius: 12, padding: '13px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 20px var(--accent-shadow)',
        }}>Generate Report →</button>
      </div>
    </>
  );
}
