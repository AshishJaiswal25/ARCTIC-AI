import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme.jsx';

export default function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '10x', label: 'Faster Diagnostics' },
    { value: '500+', label: 'Fault Codes' },
    { value: '24/7', label: 'AI Available' },
    { value: '95%', label: 'Accuracy Rate' },
  ];

  const features = [
    {
      icon: '🔍',
      title: 'Smart Diagnostics',
      desc: 'AI-powered fault detection across all major HVAC brands. Just describe symptoms - Arctic AI does the rest.',
    },
    {
      icon: '📸',
      title: 'Photo Analysis',
      desc: 'Snap a photo of the unit, error codes, or wiring - our vision AI identifies issues instantly.',
    },
    {
      icon: '💬',
      title: 'Expert Chat',
      desc: 'Chat with an AI that knows refrigerant charts, fault codes, and repair procedures inside out.',
    },
    {
      icon: '📋',
      title: 'Job Reports',
      desc: 'Auto-generated professional reports with diagnosis, parts needed, and repair steps.',
    },
    {
      icon: '🧠',
      title: 'RAG Knowledge Base',
      desc: 'Built on real HVAC manuals, brand-specific data, and thousands of field repair cases.',
    },
    {
      icon: '🔧',
      title: 'PT Charts & Tools',
      desc: 'Pressure-temperature charts, superheat/subcool calculators, and refrigerant data at your fingertips.',
    },
  ];

  const blueCollarQuotes = [
    { text: "Finally, an AI that speaks our language - not corporate jargon.", name: "Mike R.", role: "20yr HVAC Tech" },
    { text: "Cut my diagnosis time in half. My van's got a new co-pilot.", name: "Carlos M.", role: "Service Manager" },
    { text: "I was skeptical about AI. This thing actually knows what a TXV does.", name: "Dave K.", role: "Residential Tech" },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>

      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '40px 20px',
        overflow: 'hidden',
      }}>
        {/* Animated background glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: `translate(-50%, ${scrollY * 0.3}px)`,
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Nav */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          zIndex: 100,
          background: scrollY > 50 ? 'var(--bg-primary)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid var(--border-primary)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>❄️</div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>ARCTIC</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 500, marginTop: 2 }}>AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent', border: '1px solid var(--border-secondary)',
                borderRadius: 8, padding: '7px 12px', fontSize: 16, cursor: 'pointer',
                color: 'var(--text-secondary)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-secondary)'; }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onGetStarted}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '1px solid var(--border-secondary)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-secondary)'; e.target.style.color = 'var(--text-primary)'; }}
            >
              Sign In →
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{
          textAlign: 'center',
          maxWidth: 800,
          position: 'relative',
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'var(--accent-bg-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            Built for HVAC Technicians
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 20px',
          }}>
            Your AI-Powered
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #f97316, #fb923c, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Diagnostic Partner
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: '0 auto 36px',
            maxWidth: 560,
          }}>
            Stop guessing. Arctic AI analyzes symptoms, reads fault codes,
            and delivers expert-level HVAC diagnostics - right from your phone.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              style={{
                padding: '16px 36px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 30px var(--accent-shadow)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 40px var(--accent-shadow)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 30px var(--accent-shadow)'; }}
            >
              Try Arctic AI - Free
            </button>
            <a
              href="#features"
              style={{
                padding: '16px 36px',
                background: 'var(--bg-hover)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = 'var(--text-dim)'; e.target.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-secondary)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              Learn More ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          opacity: scrollY > 100 ? 0 : 0.5,
          transition: 'opacity 0.3s',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 30, background: 'linear-gradient(to bottom, var(--text-ghost), transparent)' }} />
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 1,
        background: 'var(--border-primary)',
        borderTop: '1px solid var(--border-primary)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: '32px 20px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
          }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ═══ BLUE COLLAR SECTION ═══ */}
      <section style={{
        padding: '100px 20px',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 16,
          }}>
            Built By Techs, For Techs
          </p>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 20px',
            lineHeight: 1.15,
          }}>
            We Know the Trades.
            <br />
            <span style={{ color: 'var(--text-muted)' }}>This AI Was Built for You.</span>
          </h2>
          <p style={{
            fontSize: 17,
            color: 'var(--text-dim)',
            lineHeight: 1.7,
            maxWidth: 640,
            margin: '0 auto 50px',
          }}>
            HVAC technicians are the backbone of comfort. You work in crawl spaces,
            on rooftops, in 120°F attics. You deserve a tool that works as hard as you do -
            not some generic chatbot that doesn't know the difference between R-410A and R-22.
          </p>

          {/* Trade icons row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 50,
          }}>
            {[
              { emoji: '🔧', label: 'Wrenches' },
              { emoji: '❄️', label: 'Refrigeration' },
              { emoji: '🔥', label: 'Heating' },
              { emoji: '💨', label: 'Airflow' },
              { emoji: '⚡', label: 'Electrical' },
              { emoji: '📊', label: 'Diagnostics' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 12,
                minWidth: 90,
              }}>
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Blue collar values */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            textAlign: 'left',
          }}>
            {[
              { icon: '🦺', title: 'Built for the Field', desc: 'Works on your phone. No laptop needed. Designed for techs with dirty hands and real problems.' },
              { icon: '💪', title: 'Respects Your Expertise', desc: "It doesn't replace you - it amplifies you. Your experience + AI knowledge = unstoppable." },
              { icon: '⏱️', title: 'Saves Your Time', desc: "Stop flipping through manuals. Get instant answers so you can finish the job and get to the next one." },
            ].map((item, i) => (
              <div key={i} style={{
                padding: 24,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 14,
              }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{item.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-secondary)' }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section id="features" style={{
        padding: '100px 20px',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 16,
            }}>
              Features
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              Everything You Need on the Job
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 28,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 16,
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: 32, display: 'block', marginBottom: 14 }}>{f.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-secondary)' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{
        padding: '100px 20px',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 16,
            }}>
              How It Works
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              Four Steps. One Diagnosis.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', title: 'Intake', desc: 'Enter equipment type, brand, model, and symptoms. Snap photos if needed.', color: '#f97316' },
              { step: '02', title: 'AI Diagnosis', desc: 'Arctic AI analyzes your input against thousands of known issues and fault codes.', color: '#fb923c' },
              { step: '03', title: 'Expert Chat', desc: 'Ask follow-up questions. Get step-by-step repair guidance and part numbers.', color: '#f59e0b' },
              { step: '04', title: 'Job Report', desc: 'Auto-generated professional report ready to share with your customer or office.', color: '#fbbf24' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 24,
                padding: '28px 0',
                borderBottom: i < 3 ? '1px solid var(--border-primary)' : 'none',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 800,
                  color: item.color,
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-secondary)' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{
        padding: '80px 20px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {blueCollarQuotes.map((q, i) => (
              <div key={i} style={{
                padding: 28,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 14,
              }}>
                <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.3 }}>"</div>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px', fontStyle: 'italic' }}>
                  {q.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>
                    {q.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{q.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{q.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{
        padding: '100px 20px',
        background: 'var(--bg-primary)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          bottom: '-40%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            lineHeight: 1.15,
          }}>
            Ready to Work Smarter?
          </h2>
          <p style={{
            fontSize: 17,
            color: 'var(--text-dim)',
            margin: '0 auto 36px',
            maxWidth: 480,
            lineHeight: 1.6,
          }}>
            Join hundreds of HVAC technicians already using Arctic AI to diagnose faster, fix smarter, and finish sooner.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 40px var(--accent-shadow)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 50px var(--accent-shadow)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 40px var(--accent-shadow)'; }}
          >
            Try Arctic AI - Free →
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '32px 20px',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-primary)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12,
          }}>❄️</div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>ARCTIC AI</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)' }}>
          © {new Date().getFullYear()} Arctic AI · arctic-ai.org · Built for the trades, by people who respect them.
        </p>
      </footer>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
