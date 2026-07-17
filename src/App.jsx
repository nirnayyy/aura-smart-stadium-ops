import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Play, Pause, RefreshCw, Cpu, Smartphone, ShieldCheck, 
  Zap, Radio, Sun, Moon
} from 'lucide-react';
import { 
  INITIAL_STADIUM_STATE, 
  tickSimulation, 
  addLog, 
  SCENARIOS 
} from './utils/simulationEngine';
import { generateAIOrchestration } from './utils/aiOrchestrator';
import AdminDashboard from './components/AdminDashboard';
import FanApp from './components/FanApp';

// Particle system for premium background
function ParticleCanvas({ theme }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles based on active theme colors
    const count = 70;
    particles.current = Array.from({ length: count }, () => {
      // Dark theme gets neon red/coral particles; Light theme gets electric blue/purple
      const hue = theme === 'dark' 
        ? (Math.random() > 0.6 ? 345 : Math.random() > 0.3 ? 15 : 355) 
        : (Math.random() > 0.6 ? 220 : Math.random() > 0.3 ? 260 : 200);

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.6,
        opacity: Math.random() * 0.35 + 0.05,
        hue: hue,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'dark'
          ? `hsla(${p.hue}, 95%, 65%, ${p.opacity})`
          : `hsla(${p.hue}, 90%, 60%, ${p.opacity * 0.85})`;
        ctx.fill();
      }

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i];
          const b = particles.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const lineOpacity = 0.04 * (1 - dist / 140);
            ctx.strokeStyle = theme === 'dark'
              ? `rgba(14, 165, 233, ${lineOpacity})`
              : `rgba(47, 96, 246, ${lineOpacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

// Scrolling news ticker
function NewsTicker({ state, aiData }) {
  const items = [
    { text: `MATCH CLOCK: ${state.matchInfo.minute}:${state.matchInfo.second < 10 ? '0' : ''}${state.matchInfo.second} | SCORE: ${state.matchInfo.score}`, color: '#10b981' },
    { text: `GLOBAL SENTIMENT: ${state.matchInfo.sentiment}%`, color: state.matchInfo.sentiment > 70 ? 'var(--color-green)' : 'var(--color-amber)' },
    { text: `ATTENDANCE: ${state.matchInfo.attendance.toLocaleString()} / ${state.matchInfo.maxCapacity.toLocaleString()}`, color: 'var(--color-cyan)' },
    { text: `WEATHER DIAGNOSTICS: ${state.matchInfo.weather}`, color: state.matchInfo.weatherPhase === 'Storm' ? 'var(--color-red)' : 'var(--text-secondary)' },
    { text: `GATE C TURNSTILES: ${state.gates.C.queue} queued`, color: state.gates.C.scannerStatus === 'Error' ? 'var(--color-red)' : 'var(--color-cyan)' },
    { text: `GATE B INGRESS: ${state.gates.B.queue} queued`, color: 'var(--color-cyan)' },
    { text: `RESTOCK STATUS: ${state.restockStatus}`, color: state.restockStatus !== 'Idle' ? 'var(--color-amber)' : 'var(--text-secondary)' },
    ...state.incidents.map(i => ({ text: `⚠ INCIDENT DETECTED: ${i.title.toUpperCase()}`, color: 'var(--color-red)' })),
    ...(aiData?.signageDirectives || []).map(d => ({ text: `📡 SIGNAGE BROADCAST: ${d}`, color: 'var(--color-amber)' })),
  ];

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="ticker-bar">
      <div className="ticker-label">
        <Zap size={10} style={{ marginRight: '4px' }} /> TELEMETRY BROADCAST
      </div>
      <div className="ticker-content">
        <div className="ticker-scroll" style={{ animationDuration: '35s' }}>
          {doubled.map((item, idx) => (
            <span key={idx} className="ticker-item">
              <span className="ticker-dot" style={{ background: item.color }} />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Live system clock
function SystemClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      fontFamily: 'var(--font-mono)', 
      fontSize: '11px',
      color: 'var(--text-secondary)',
      letterSpacing: '0.04em'
    }}>
      <Radio size={10} style={{ color: 'var(--color-cyan)', animation: 'breathe 2s ease-in-out infinite' }} />
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(INITIAL_STADIUM_STATE);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 5x speed factors
  const [viewMode, setViewMode] = useState('both');
  const [selectedElement, setSelectedElement] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Bind active theme to data-theme attribute on document body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Run simulation clock loop using configurable speed
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const intervalMs = 5000 / simSpeed;
      timer = setInterval(() => {
        setState(prev => tickSimulation(prev));
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simSpeed]);

  // Compute dynamic AI cooperation values
  const aiData = generateAIOrchestration(state);

  // Trigger operational scenarios
  const triggerScenario = (scenarioKey) => {
    const scenario = SCENARIOS[scenarioKey];
    if (scenario) {
      setState(prev => scenario.trigger(prev));
    }
  };

  // Reset systems
  const resetSystem = () => {
    setState(INITIAL_STADIUM_STATE);
    setSelectedElement(null);
    setIsPlaying(true);
    setSimSpeed(1);
  };

  // Dispatch restock event manually
  const dispatchRestock = () => {
    if (state.restockStatus === 'Idle') {
      setState(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.restockStatus = "Dispatching";
        addLog(next, "SYSTEM", "Operator", "Dispatched inventory restock team to all stands.");
        return next;
      });
    }
  };

  return (
    <div className="aura-container">
      {/* Dynamic Background Particle Field */}
      <ParticleCanvas theme={theme} />

      {/* Background radial overlays */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* Scanline overlays */}
      <div className="scanline-overlay" />
      <div className="scanline-sweep" />

      {/* Live news ticker */}
      <NewsTicker state={state} aiData={aiData} />

      {/* Header bar */}
      <header className="aura-header">
        <div className="logo-container" style={{ position: 'relative', zIndex: 10 }}>
          <span className="logo-text">
            <Cpu size={20} style={{ filter: 'drop-shadow(0 0 10px var(--color-cyan))' }} /> AURA
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '14px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              v3.2 ULTRA // FIFA WORLD CUP 2026
            </span>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', opacity: 0.6 }}>
              COOPERATIVE AGENTS ORCHESTRATION
            </span>
          </div>
        </div>

        {/* Global Controls & Theme Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 10 }}>
          
          <SystemClock />

          {/* Theme Switcher Button */}
          <button
            className="mode-btn"
            style={{ padding: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={13} style={{ color: 'var(--color-amber)' }} /> : <Moon size={13} style={{ color: 'var(--color-cyan)' }} />}
          </button>

          {/* Logistics Dispatch restock button */}
          <button 
            className={`mode-btn ${state.restockStatus !== 'Idle' ? 'active' : ''}`}
            style={{ padding: '5px 12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={dispatchRestock}
            disabled={state.restockStatus !== 'Idle'}
          >
            <RefreshCw size={10} className={state.restockStatus === 'In Progress' ? 'spin-slow' : ''} />
            RESTOCK CARTS
          </button>

          {/* Live Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span style={{ 
                width: '6px', height: '6px', 
                background: isPlaying ? 'var(--color-green)' : 'var(--color-amber)', 
                borderRadius: '50%',
                boxShadow: isPlaying ? 'var(--glow-green)' : 'var(--glow-yellow)'
              }} />
              {isPlaying && (
                <span style={{
                  position: 'absolute', inset: '-2px',
                  borderRadius: '50%',
                  background: 'var(--color-green)',
                  animation: 'status-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
              )}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {isPlaying ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          {/* Play/Pause controls */}
          <button 
            className="mode-btn active"
            style={{ padding: '5px 12px', fontSize: '10px', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            {isPlaying ? 'PAUSE' : 'RESUME'}
          </button>

          {/* Simulation speed multipliers */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.015)', border: 'var(--border-glass)', borderRadius: 'var(--radius-pill)', padding: '2px' }}>
            {[1, 2, 5].map(speed => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`mode-btn ${simSpeed === speed ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '9px', borderRadius: 'var(--radius-pill)' }}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Dual/Admin/Fan view switcher */}
          <div className="mode-switcher">
            <button 
              className={`mode-btn ${viewMode === 'both' ? 'active' : ''}`}
              onClick={() => setViewMode('both')}
            >
              <Activity size={13} /> DUAL
            </button>
            <button 
              className={`mode-btn ${viewMode === 'admin' ? 'active' : ''}`}
              onClick={() => setViewMode('admin')}
            >
              <ShieldCheck size={13} /> COMMAND
            </button>
            <button 
              className={`mode-btn ${viewMode === 'fan' ? 'active' : ''}`}
              onClick={() => setViewMode('fan')}
            >
              <Smartphone size={13} /> FAN APP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        overflow: 'hidden', 
        background: 'transparent',
        position: 'relative',
        zIndex: 5,
        minHeight: 0
      }}>
        
        {/* DUAL VIEW LAYOUT */}
        {viewMode === 'both' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 375px', 
            height: '100%', 
            overflow: 'hidden',
          }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <AdminDashboard 
                state={state} 
                aiData={aiData} 
                triggerScenario={triggerScenario} 
                resetSystem={resetSystem}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
              />
            </div>
            <div style={{ 
              height: '100%', 
              background: 'rgba(5, 6, 8, 0.25)', 
              borderLeft: 'var(--border-glass)',
              overflowY: 'auto'
            }}>
              <FanApp 
                state={state} 
                aiData={aiData} 
                updateState={setState} 
              />
            </div>
          </div>
        )}

        {/* ADMIN VIEW ONLY */}
        {viewMode === 'admin' && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <AdminDashboard 
              state={state} 
              aiData={aiData} 
              triggerScenario={triggerScenario} 
              resetSystem={resetSystem}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
            />
          </div>
        )}

        {/* FAN VIEW ONLY */}
        {viewMode === 'fan' && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <FanApp 
              state={state} 
              aiData={aiData} 
              updateState={setState} 
            />
          </div>
        )}

      </main>
    </div>
  );
}
