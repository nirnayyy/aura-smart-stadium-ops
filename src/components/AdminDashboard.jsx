import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Activity, AlertTriangle, Cpu, RefreshCw, 
  Terminal, Video, Users, CloudLightning,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Compass,
  Zap, Gauge, Eye, Filter, MessageSquare
} from 'lucide-react';
import StadiumMap from './StadiumMap';

// Radial Gauge Component
function RadialGauge({ value, max, label, color = 'var(--color-cyan)', size = 86 }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);
  const percentValue = Math.round(percentage * 100);

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
      role="progressbar"
      aria-valuenow={percentValue}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`${label} gauge, current level ${percentValue}%`}
    >
      <div className="radial-gauge" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 86 86" aria-hidden="true">
          <circle cx="43" cy="43" r={radius} className="gauge-bg" />
          <circle 
            cx="43" cy="43" r={radius} 
            className="gauge-fill"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="gauge-value">
          <span style={{ color }}>{percentValue}</span>
        </div>
      </div>
      <span className="gauge-label">{label}</span>
    </div>
  );
}

// Mini sparkline chart
function Sparkline({ data, color = 'var(--color-cyan)' }) {
  const max = Math.max(1, ...data);
  return (
    <div className="sparkline-container" role="img" aria-label={`Sparkline graph history: ${data.join(', ')}`}>
      {data.map((val, i) => (
        <div 
          key={i} 
          className="sparkline-bar"
          style={{ 
            height: `${Math.max(3, (val / max) * 24)}px`,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            width: '3px',
            opacity: i === data.length - 1 ? 1 : 0.6
          }}
        />
      ))}
    </div>
  );
}

// Weather mini widget
function WeatherWidget({ weather }) {
  const isStorm = weather.toLowerCase().includes('storm');
  const isClear = weather.toLowerCase().includes('clear');
  
  return (
    <div className="weather-widget" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.015)',
      border: 'var(--border-glass)'
    }}>
      <div style={{ fontSize: '20px' }}>
        {isStorm ? '⛈️' : isClear ? '☀️' : '🌤️'}
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: isStorm ? 'var(--color-red)' : 'var(--text-primary)' }}>
          {weather}
        </div>
        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {isStorm ? 'SEVERE WARNING' : 'CONDITIONS NOMINAL'}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ 
  state, 
  aiData, 
  triggerScenario, 
  resetSystem, 
  selectedElement, 
  setSelectedElement,
  dynamicDialogue = null,
  isGeneratingDialogue = false
}) {
  const [activeCam, setActiveCam] = useState('CAM_04');
  const [cctvNoise, setCctvNoise] = useState(false);
  const [cctvFilter, setCctvFilter] = useState('normal'); // normal, thermal, night, outline
  const [camPan, setCamPan] = useState({ x: 0, y: 0 });
  const [sparkData, setSparkData] = useState([12, 18, 14, 22, 16, 28, 20, 24, 30, 26, 22, 34]);
  const [logView, setLogView] = useState('operations'); // operations, negotiation
  const [logFilter, setLogFilter] = useState('ALL'); // ALL, ALERT, SYSTEM, MATCH, TRANSIT

  // Simulate CCTV static lines and scanning noise
  useEffect(() => {
    const interval = setInterval(() => {
      setCctvNoise(prev => !prev);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Update sparkline data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkData(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 30) + 10];
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Determine active camera details based on incidents
  const getCameraStatus = React.useCallback(() => {
    if (state.incidents.find(i => i.id === 'incident-gate-c') && activeCam === 'CAM_04') {
      return { status: 'BOTTLENECK DETECTED', sub: 'QUEUE OVERFLOW ACTIVE', color: 'var(--color-red)' };
    }
    if (state.incidents.find(i => i.id === 'incident-medical-108') && activeCam === 'CAM_08') {
      return { status: 'INCIDENT FLAGGED', sub: 'MEDICAL TEAM EN ROUTE', color: 'var(--color-red)' };
    }
    if (state.incidents.find(i => i.id === 'incident-power') && activeCam === 'CAM_08') {
      return { status: 'SENSORS OFFLINE', sub: 'BACKUP TELEMETRY STREAM', color: 'var(--color-amber)' };
    }
    return { status: 'NOMINAL FEED', sub: 'ALL SECURE', color: 'var(--color-green)' };
  }, [state.incidents, activeCam]);

  const camFeedStatus = getCameraStatus();

  // PTZ Control simulation
  const handlePan = React.useCallback((direction) => {
    setCamPan(prev => {
      let { x, y } = prev;
      if (direction === 'up') y = Math.min(15, y + 5);
      if (direction === 'down') y = Math.max(-15, y - 5);
      if (direction === 'left') x = Math.max(-15, x - 5);
      if (direction === 'right') x = Math.min(15, x + 5);
      return { x, y };
    });
  }, []);

  // Filtered operational logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return state.logs;
    return state.logs.filter(log => log.type === logFilter);
  }, [state.logs, logFilter]);

  const capacityPercent = Math.round((state.matchInfo.attendance / state.matchInfo.maxCapacity) * 100);

  // CCTV Filter styling classes
  const getFilterStyle = () => {
    switch (cctvFilter) {
      case 'thermal':
        return {
          background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, rgba(59,130,246,0.3) 100%)',
          filter: 'hue-rotate(180deg) saturate(300%) contrast(150%)',
          color: '#ff3b30'
        };
      case 'night':
        return {
          background: 'rgba(16,185,129,0.08)',
          filter: 'sepia(100%) hue-rotate(90deg) saturate(200%) brightness(1.2)',
          color: '#10b981'
        };
      case 'outline':
        return {
          background: '#000',
          filter: 'invert(100%) difference',
          color: '#ffffff'
        };
      default:
        return {};
    }
  };

  return (
    <div className="ad-layout-container">
      
      {/* LEFT COLUMN: CONTROLS & TELEMETRY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* Scenario Controls Panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
          <h3 className="section-header" style={{ marginBottom: '14px' }}>
            <Cpu size={14} className="glow-text-magenta" /> OPERATION INJECTS
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Inject anomalies into live telemetry to evaluate multi-agent cooperation overrides.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="scenario-btn"
              style={{ border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--color-red)', background: state.incidents.some(i=>i.id==='incident-gate-c') ? 'rgba(239,68,68,0.05)' : 'transparent' }}
              onClick={() => triggerScenario('GATE_JAM')}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Gate C Turnstile Jam
            </button>
            <button 
              className="scenario-btn"
              style={{ border: '1px solid rgba(245, 158, 11, 0.15)', color: 'var(--color-amber)', background: state.incidents.some(i=>i.id==='incident-taco-stock') ? 'rgba(245,158,11,0.05)' : 'transparent' }}
              onClick={() => triggerScenario('CONCESSION_RUSH')}
            >
              <Users size={14} aria-hidden="true" /> Concession Stock Out
            </button>
            <button 
              className="scenario-btn"
              style={{ border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--color-red)', background: state.incidents.some(i=>i.id==='incident-medical-108') ? 'rgba(239,68,68,0.05)' : 'transparent' }}
              onClick={() => triggerScenario('MEDICAL_ALERT')}
            >
              <Activity size={14} aria-hidden="true" /> Sec 108 Medical Alert
            </button>
            <button 
              className="scenario-btn"
              style={{ border: '1px solid rgba(99, 102, 241, 0.15)', color: 'var(--color-indigo)', background: state.incidents.some(i=>i.id==='incident-storm') ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              onClick={() => triggerScenario('STORM_EVACUATION')}
            >
              <CloudLightning size={14} aria-hidden="true" /> Egress Storm Warning
            </button>
            <button 
              className="scenario-btn"
              style={{ border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--color-red)', background: state.incidents.some(i=>i.id==='incident-power') ? 'rgba(239,68,68,0.05)' : 'transparent' }}
              onClick={() => triggerScenario('POWER_OUTAGE')}
            >
              <Zap size={14} aria-hidden="true" /> Sec 108 Grid Outage
            </button>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', margin: '8px 0' }} />
            
            <button 
              className="scenario-btn"
              style={{ background: 'var(--bg-tertiary)', border: 'var(--border-glass)', justifyContent: 'center', color: 'var(--text-secondary)' }}
              onClick={resetSystem}
            >
              <RefreshCw size={12} aria-hidden="true" /> Recalibrate Systems
            </button>
          </div>
        </div>

        {/* Gauges Row */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
          <h3 className="section-header" style={{ marginBottom: '16px' }}>
            <Gauge size={14} className="glow-text-cyan" /> SYSTEM METRICS
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <RadialGauge 
              value={state.matchInfo.attendance} 
              max={state.matchInfo.maxCapacity} 
              label="ATTENDANCE" 
              color={capacityPercent > 95 ? 'var(--color-red)' : 'var(--color-cyan)'} 
              size={70}
            />
            <RadialGauge 
              value={state.matchInfo.sentiment} 
              max={100} 
              label="SENTIMENT" 
              color={state.matchInfo.sentiment > 75 ? 'var(--color-green)' : state.matchInfo.sentiment > 45 ? 'var(--color-amber)' : 'var(--color-red)'} 
              size={70}
            />
            <RadialGauge 
              value={state.incidents.length} 
              max={5} 
              label="INCIDENTS" 
              color={state.incidents.length > 2 ? 'var(--color-red)' : state.incidents.length > 0 ? 'var(--color-amber)' : 'var(--color-green)'} 
              size={70}
            />
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 className="section-header" style={{ marginBottom: '4px' }}>
            <Activity size={14} className="glow-text-cyan" /> TELEMETRY
          </h3>
          
          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>MATCH CLOCK</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{state.matchInfo.minute}:{state.matchInfo.second < 10 ? '0' : ''}{state.matchInfo.second}</span>
                  <span className="glow-text-cyan" style={{ fontSize: '16px', fontWeight: 800 }}>{state.matchInfo.score}</span>
                </div>
              </div>
              <Sparkline data={sparkData} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              <span>POSS: {state.matchInfo.possession}</span>
              <span>SHOTS: {state.matchInfo.shots}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              <span>VENUE OCCUPANCY</span>
              <span>{capacityPercent}%</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {state.matchInfo.attendance.toLocaleString()} 
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}> / {state.matchInfo.maxCapacity.toLocaleString()}</span>
            </div>
            <div className="progress-bar" style={{ marginTop: '10px' }}>
              <div className="progress-fill" style={{ width: `${capacityPercent}%` }} />
            </div>
          </div>

          <WeatherWidget weather={state.matchInfo.weather} />
        </div>
      </div>

      {/* CENTER COLUMN: MAP & TERMINAL */}
      <div style={{ display: 'grid', gridTemplateRows: '1fr 220px', gap: '20px', overflow: 'hidden' }}>
        
        <StadiumMap 
          state={state} 
          aiData={aiData} 
          selectedElement={selectedElement} 
          setSelectedElement={setSelectedElement} 
        />
        
        {/* Operations Logs / Negotiation Dialogs Tab Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            <button 
              className={`mode-btn ${logView === 'operations' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: '9px', borderRadius: '4px' }}
              onClick={() => setLogView('operations')}
            >
              <Terminal size={11} /> LOG CONSOLE
            </button>
            <button 
              className={`mode-btn ${logView === 'negotiation' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: '9px', borderRadius: '4px' }}
              onClick={() => setLogView('negotiation')}
            >
              <MessageSquare size={11} /> AGENT DIALOGS
            </button>

            {logView === 'operations' && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={9} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <select 
                  value={logFilter} 
                  aria-label="Filter Log Source"
                  onChange={(e) => setLogFilter(e.target.value)}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border-glass)', borderRadius: '4px', fontSize: '8.5px', fontFamily: 'var(--font-mono)', padding: '2px 4px', outline: 'none' }}
                >
                  <option value="ALL">ALL SOURCES</option>
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="ALERT">ALERT</option>
                  <option value="WEATHER">WEATHER</option>
                  <option value="MATCH">MATCH</option>
                  <option value="TRANSIT">TRANSIT</option>
                </select>
              </div>
            )}
            {logView === 'negotiation' && (
              <span style={{ marginLeft: 'auto', fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {aiData?.negotiationLogs.length || 0} active incident briefs
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px' }}>
            {logView === 'operations' ? (
              filteredLogs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs matched filters</div>
              ) : (
                filteredLogs.map((log, idx) => (
                  <div 
                    key={`log-${idx}`} 
                    style={{
                      marginBottom: '4px',
                      lineHeight: 1.4,
                      color: log.type === 'ALERT' ? 'var(--color-red)' : 
                             log.type === 'MATCH' ? 'var(--color-green)' : 
                             log.type === 'TRANSIT' ? 'var(--color-cyan)' : 'var(--text-secondary)'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>{' '}
                    <span style={{ opacity: 0.6 }}>{log.sender}:</span>{' '}
                    {log.message}
                  </div>
                ))
              )
            ) : (
              isGeneratingDialogue ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-cyan)', fontSize: '10.5px' }}>
                  <span className="loading-dots">AURA Operations Channel Active. Querying Gemini...</span>
                </div>
              ) : dynamicDialogue ? (
                <div key="negotiation-gemini" style={{ marginBottom: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-cyan)', fontSize: '9.5px', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    LIVE DYNAMIC COLLABORATION DIALOGUE (POWERED BY GEMINI)
                  </div>
                  {dynamicDialogue.map((d, i) => (
                    <div key={i} style={{ marginBottom: '4px', lineHeight: 1.4 }}>
                      <span style={{ 
                        color: d.agent.includes('IncidentCmd') ? 'var(--color-red)' : 
                               d.agent.includes('CrowdFlow') ? 'var(--color-cyan)' : 
                               d.agent.includes('FanExp') ? 'var(--color-magenta)' : 'var(--color-amber)', 
                        fontWeight: 700 
                      }}>
                        {d.agent}:
                      </span>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{d.text}</span>
                    </div>
                  ))}
                </div>
              ) : aiData?.negotiationLogs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10.5px' }}>
                  No active incidents. Multi-agent negotiation channels are in standby mode.
                </div>
              ) : (
                aiData?.negotiationLogs.map((block) => (
                  <div key={block.id} style={{ marginBottom: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-cyan)', fontSize: '9.5px', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      INCIDENT ACTION ROUTINE: {block.incident.toUpperCase()}
                    </div>
                    {block.dialogs.map((d, i) => (
                      <div key={i} style={{ marginBottom: '4px', lineHeight: 1.4 }}>
                        <span style={{ 
                          color: d.agent.includes('IncidentCmd') ? 'var(--color-red)' : 
                                 d.agent.includes('CrowdFlow') ? 'var(--color-cyan)' : 
                                 d.agent.includes('FanExp') ? 'var(--color-magenta)' : 'var(--color-amber)', 
                          fontWeight: 700 
                        }}>
                          {d.agent}:
                        </span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{d.text}</span>
                      </div>
                    ))}
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: AI & CCTV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* CCTV Feed */}
        <div className="glass-panel animate-slide-in" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 className="section-header">
            <Video size={14} className="glow-text-cyan" /> CCTV MONITOR
            <span style={{ marginLeft: 'auto', fontSize: '9px', fontFamily: 'var(--font-mono)', color: camFeedStatus.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={10} /> {activeCam}
            </span>
          </h3>
          
          <div style={{
            height: '170px',
            background: '#040508',
            borderRadius: 'var(--radius-sm)',
            border: 'var(--border-glass-bright)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            ...getFilterStyle()
          }}>
            {/* Visual Scanline Effect */}
            <div className="scanline-overlay" style={{ opacity: 0.15 }} />
            
            {cctvNoise && (
              <div style={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: 0, width: '100%', height: '2px',
                background: 'rgba(255,255,255,0.08)',
                zIndex: 2
              }} />
            )}

            <div style={{ padding: '10px', fontSize: '9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{activeCam} // L: {(40.8121 + camPan.y / 1000).toFixed(4)}°N // W: {(-74.0743 + camPan.x / 1000).toFixed(4)}°W</span>
                <span style={{ color: camFeedStatus.color, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                  LIVE <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: camFeedStatus.color, animation: 'blink 1s infinite' }} />
                </span>
              </div>

              {/* PTZ Targeting Reticle */}
              <div style={{ 
                position: 'absolute', 
                top: `calc(50% + ${camPan.y}px)`, 
                left: `calc(50% + ${camPan.x}px)`, 
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}>
                <div style={{ width: '50px', height: '50px', border: `1px dashed ${cctvFilter === 'thermal' ? 'rgba(239,68,68,0.5)' : 'rgba(16, 185, 129, 0.4)'}`, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: '4px', height: '4px', background: cctvFilter === 'thermal' ? 'var(--color-red)' : 'var(--color-green)', borderRadius: '50%' }} />
                </div>
              </div>

              <div style={{ alignSelf: 'center', textAlign: 'center', color: camFeedStatus.color, textShadow: `0 0 8px ${camFeedStatus.color}`, marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.06em' }}>{camFeedStatus.status}</div>
                <div style={{ fontSize: '7.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>{camFeedStatus.sub}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Compass size={9} /> PTZ: {camPan.x * 12}° H / {camPan.y * 12}° V
                </span>
                <span>CALIBRATION: 100%</span>
              </div>
            </div>
          </div>

          {/* CCTV Filter Selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['normal', 'thermal', 'night', 'outline'].map(f => (
              <button
                key={f}
                className={`mode-btn ${cctvFilter === f ? 'active' : ''}`}
                style={{ flex: 1, padding: '3px 0', fontSize: '8.5px', textTransform: 'uppercase', borderRadius: '4px' }}
                onClick={() => setCctvFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Camera Selection & PTZ Control Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button 
                className={`mode-btn ${activeCam === 'CAM_04' ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '5px 8px', justifyContent: 'flex-start', borderRadius: '6px' }}
                onClick={() => { setActiveCam('CAM_04'); setCamPan({x: 0, y:0}); }}
              >
                CAM-04 (Gate C Ingress)
              </button>
              <button 
                className={`mode-btn ${activeCam === 'CAM_08' ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '5px 8px', justifyContent: 'flex-start', borderRadius: '6px' }}
                onClick={() => { setActiveCam('CAM_08'); setCamPan({x: 0, y:0}); }}
              >
                CAM-08 (East Stand 108)
              </button>
            </div>
            
            {/* PTZ D-Pad */}
            <div style={{ 
              display: 'grid', 
              gridTemplateAreas: '"empty up empty" "left center right" "empty down empty"',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
              gap: '1px',
              background: 'rgba(255,255,255,0.015)',
              border: 'var(--border-glass)',
              borderRadius: '8px',
              padding: '3px'
            }}>
              {[
                { area: 'up', dir: 'up', icon: <ChevronUp size={11} aria-hidden="true" /> },
                { area: 'left', dir: 'left', icon: <ChevronLeft size={11} aria-hidden="true" /> },
                { area: 'right', dir: 'right', icon: <ChevronRight size={11} aria-hidden="true" /> },
                { area: 'down', dir: 'down', icon: <ChevronDown size={11} aria-hidden="true" /> },
              ].map(btn => (
                <button 
                  key={btn.area}
                  onClick={() => handlePan(btn.dir)} 
                  aria-label={`Pan camera ${btn.dir}`}
                  style={{ gridArea: btn.area, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--color-cyan)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  {btn.icon}
                </button>
              ))}
              <div style={{ gridArea: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '7px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} aria-hidden="true">PTZ</div>
            </div>
          </div>
        </div>

        {/* AI Operation Directives */}
        <div className="glass-panel animate-slide-in" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
          <h3 className="section-header">
            <Cpu size={14} className="glow-text-magenta" /> AURA DIRECTIVES
            <span style={{ marginLeft: 'auto' }}>
              <span className={`badge ${state.incidents.length > 0 ? 'badge-critical' : 'badge-info'}`}>
                {aiData?.recommendations.length || 0} ACTIVE
              </span>
            </span>
          </h3>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            {aiData?.recommendations.map((rec, idx) => {
              const borderColor = 
                rec.colorClass === 'cyan' ? 'var(--color-cyan)' : 
                rec.colorClass === 'red' ? 'var(--color-red)' : 
                rec.colorClass === 'yellow' ? 'var(--color-amber)' : 
                'var(--color-magenta)';

              const badgeClass = 
                rec.priority === 'CRITICAL' ? 'badge-critical' : 
                rec.priority === 'HIGH' ? 'badge-high' : 
                rec.priority === 'MEDIUM' ? 'badge-medium' : 'badge-info';
              
              return (
                <div 
                  key={`rec-${idx}`} 
                  className="directive-card"
                  style={{ 
                    borderLeft: `3px solid ${borderColor}`,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.01)',
                    borderRadius: 'var(--radius-sm)',
                    border: 'var(--border-glass)',
                    borderLeftWidth: '3px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', color: borderColor }}>
                      {rec.agent}
                    </span>
                    <span className={`badge ${badgeClass}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {rec.action}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rec.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

RadialGauge.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
  size: PropTypes.number
};

Sparkline.propTypes = {
  data: PropTypes.array.isRequired,
  color: PropTypes.string
};

WeatherWidget.propTypes = {
  weather: PropTypes.string.isRequired
};

AdminDashboard.propTypes = {
  state: PropTypes.object.isRequired,
  aiData: PropTypes.object.isRequired,
  triggerScenario: PropTypes.func.isRequired,
  resetSystem: PropTypes.func.isRequired,
  selectedElement: PropTypes.object,
  setSelectedElement: PropTypes.func.isRequired,
  dynamicDialogue: PropTypes.array,
  isGeneratingDialogue: PropTypes.bool
};
