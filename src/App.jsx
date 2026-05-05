import { useState } from 'react';
import { callClaude, buildSystemPrompt, buildSystemPromptWithFeedback } from './api.js';
import { EMPTY_READINGS } from './constants.js';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { useAuth } from './hooks/useAuth.jsx';
import { useTheme } from './hooks/useTheme.jsx';
import { isBackendAvailable, getFeedbackEntries } from './db/s3-api.js';
import LandingPage from './components/LandingPage.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import PhaseIndicator from './components/PhaseIndicator.jsx';
import Phase1Intake from './phases/Phase1Intake.jsx';
import Phase2Diagnosis from './phases/Phase2Diagnosis.jsx';
import Phase3Chat from './phases/Phase3Chat.jsx';
import Phase4Report from './phases/Phase4Report.jsx';
import JobHistory from './phases/JobHistory.jsx';

const genId = () => `ARCTIC-${Date.now().toString(36).toUpperCase()}`;

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { isDark, toggleTheme } = useTheme();
  const [phase, setPhase] = useState(1);
  const [showAuth, setShowAuth] = useState(false); // true = show login/register instead of landing
  const [furthest, setFurthest] = useState(1);
  const [view, setView] = useState('main'); // 'main' | 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Job ID
  const [jobId] = useState(genId());

  // Phase 1 state
  const [equipType, setEquipType]       = useState('');
  const [brand, setBrand]               = useState('');
  const [modelNum, setModelNum]         = useState('');
  const [refrigerant, setRefrigerant]   = useState('');
  const [symptoms, setSymptoms]         = useState([]);
  const [readings, setReadings]         = useState({ ...EMPTY_READINGS });
  const [techNotes, setTechNotes]       = useState('');
  const [photos, setPhotos]             = useState([]);
  const [faultCode, setFaultCode]       = useState('');

  // Phase 2/3 state
  const [diagnosis, setDiagnosis]       = useState(null);
  const [chatHistory, setChatHistory]   = useState([]);

  const toggleSymptom = (s) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const goToPhase = (p) => {
    setPhase(p);
    setFurthest(prev => Math.max(prev, p));
  };

  const buildIntakeText = () => {
    const photoSummary = photos
      .filter(p => p.analysis)
      .map(p => `Photo: ${p.analysis.component} - ${p.analysis.condition_notes || ''} ${p.analysis.diagnostic_relevance || ''}`)
      .join('\n');

    return `
EQUIPMENT: ${equipType} | Brand: ${brand || 'Unknown'} | Model: ${modelNum || 'Unknown'} | Refrigerant: ${refrigerant || 'Unknown'}
FAULT CODE DISPLAYED: ${faultCode || 'None'}
SYMPTOMS: ${symptoms.join(', ') || 'None'}
READINGS:
  Suction:      ${readings.suction      || 'N/A'} psig
  Discharge:    ${readings.discharge    || 'N/A'} psig
  Superheat:    ${readings.superheat    || 'N/A'} °F
  Subcooling:   ${readings.subcooling   || 'N/A'} °F
  Suction temp: ${readings.suctionTemp  || 'N/A'} °F
  Disch. temp:  ${readings.dischargeTemp|| 'N/A'} °F
  Supply air:   ${readings.supplyTemp   || 'N/A'} °F
  Return air:   ${readings.returnTemp   || 'N/A'} °F
  Amps:         ${readings.amps         || 'N/A'} A
  Voltage:      ${readings.voltage      || 'N/A'} V
  Ambient:      ${readings.ambientTemp  || 'N/A'} °F
TECH NOTES: ${techNotes || 'None'}
${photoSummary ? `PHOTO ANALYSIS:\n${photoSummary}` : ''}`.trim();
  };

  const handleDiagnose = async () => {
    setError('');
    setLoading(true);
    try {
      const intake = buildIntakeText();

      // Build intake object for RAG knowledge retrieval
      const intakeData = {
        equipType, brand, refrigerant, symptoms,
        faultCode, techNotes, readings,
      };

      // Try to load past feedback for learning context
      let feedbackEntries = [];
      try {
        if (await isBackendAvailable()) {
          feedbackEntries = await getFeedbackEntries();
        }
      } catch { /* feedback loading is optional */ }

      // Build RAG-enhanced system prompt
      const systemPrompt = feedbackEntries.length > 0
        ? buildSystemPromptWithFeedback(brand, intakeData, feedbackEntries)
        : buildSystemPrompt(brand, intakeData);

      const result = await callClaude(
        [{ role: 'user', content: `Diagnose this HVAC system. Return ONLY valid JSON.\n${intake}` }],
        systemPrompt,
        true
      );
      if (!result) throw new Error('Empty response');
      setDiagnosis(result);
      setChatHistory([
        { role: 'user', content: intake },
        { role: 'assistant', content: JSON.stringify(result) },
      ]);
      goToPhase(2);
    } catch (e) {
      setError(e.message || 'Diagnosis failed. Check your API key.');
    }
    setLoading(false);
  };

  const handleChat = async (userMessage) => {
    setError('');
    const updated = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(updated);
    setLoading(true);
    try {
      const intakeData = {
        equipType, brand, refrigerant, symptoms,
        faultCode, techNotes, readings,
      };
      const systemPrompt = buildSystemPrompt(brand, intakeData);
      const reply = await callClaude(updated, systemPrompt);
      setChatHistory([...updated, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleNewJob = () => {
    setPhase(1);
    setFurthest(1);
    setEquipType(''); setBrand(''); setModelNum(''); setRefrigerant('');
    setSymptoms([]); setReadings({ ...EMPTY_READINGS }); setTechNotes('');
    setPhotos([]); setFaultCode('');
    setDiagnosis(null); setChatHistory([]); setError('');
    window.scrollTo(0, 0);
  };

  // Auth loading
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--text-dim)', fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in or pending verification - show landing or auth screen
  if (!user) {
    if (showAuth) {
      return <AuthScreen onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (view === 'history') {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: 'var(--text-primary)' }}>
        <JobHistory
          onLoadJob={(job) => {
            setView('main');
          }}
          onClose={() => setView('main')}
        />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
        background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 16,
        padding: '16px 20px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 0 24px var(--accent-shadow)',
        }}>
          <span style={{ fontSize: 22 }}>❄️</span>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>ARCTIC</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>AI HVAC Diagnostic System</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
            background: isOnline ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: isOnline ? 'var(--success)' : 'var(--warning)',
            border: `1px solid ${isOnline ? 'var(--success-border)' : 'var(--warning-border)'}`,
          }}>
            {isOnline ? '● Online' : '◉ Offline'}
          </span>
          <span style={{
            fontSize: 11, padding: '4px 10px', color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            👤 {user.name}
          </span>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 10,
            padding: '7px 12px', fontSize: 16, cursor: 'pointer', color: 'var(--text-secondary)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onMouseEnter={e => { e.target.style.background = 'var(--bg-hover)'; e.target.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.target.style.background = 'var(--bg-tertiary)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setView('history')} style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 10,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--bg-hover)'; e.target.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.target.style.background = 'var(--bg-tertiary)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            📁 History
          </button>
          <button onClick={logout} style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 10,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--error-bg)'; e.target.style.color = 'var(--error)'; e.target.style.borderColor = 'var(--error-border)'; }}
          onMouseLeave={e => { e.target.style.background = 'var(--bg-tertiary)'; e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--border-secondary)'; }}
          >
            Logout
          </button>
        </div>
      </div>

      <PhaseIndicator current={phase} onNavigate={goToPhase} furthest={furthest} />

      {/* Main workflow view */}
      {view === 'main' && (
        <>
          {error && (
            <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: 'var(--error)' }}>
              ⚠️ {error}
            </div>
          )}

          {!isOnline && phase === 1 && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: 'var(--warning)' }}>
              📡 Offline mode - P/T charts and fault code lookup still work. AI diagnosis requires connection.
            </div>
          )}

          {phase === 1 && (
            <Phase1Intake
              equipType={equipType}     setEquipType={setEquipType}
              brand={brand}             setBrand={setBrand}
              modelNum={modelNum}       setModelNum={setModelNum}
              refrigerant={refrigerant} setRefrigerant={setRefrigerant}
              symptoms={symptoms}       toggleSymptom={toggleSymptom}
              readings={readings}       setReadings={setReadings}
              techNotes={techNotes}     setTechNotes={setTechNotes}
              photos={photos}           setPhotos={setPhotos}
              faultCode={faultCode}     setFaultCode={setFaultCode}
              onSubmit={handleDiagnose}
              loading={loading}
            />
          )}

          {phase === 2 && diagnosis && (
            <Phase2Diagnosis
              diagnosis={diagnosis}
              photos={photos}
              onBack={() => goToPhase(1)}
              onProceed={() => goToPhase(3)}
            />
          )}

          {phase === 3 && diagnosis && (
            <Phase3Chat
              diagnosis={diagnosis}
              equipType={equipType}
              chatHistory={chatHistory}
              onSend={handleChat}
              loading={loading}
              onGenerateReport={() => goToPhase(4)}
            />
          )}

          {phase === 4 && diagnosis && (
            <Phase4Report
              jobId={jobId}
              diagnosis={diagnosis}
              equipType={equipType}     brand={brand}
              modelNum={modelNum}       refrigerant={refrigerant}
              symptoms={symptoms}       readings={readings}
              techNotes={techNotes}     photos={photos}
              faultCode={faultCode}
              onBack={() => goToPhase(3)}
              onNewJob={handleNewJob}
            />
          )}
        </>
      )}
    </div>
  );
}
