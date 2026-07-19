import React, { useMemo } from 'react';

export default function StadiumMap({ state, aiData, selectedElement, setSelectedElement }) {
  const gates = state.gates;
  const incidents = state.incidents;
  const mapRouting = aiData?.mapRouting || { highlightedSections: [], closedGates: [], suggestedRoutes: [] };

  const isPowerOffline = incidents.some(i => i.id === 'incident-power');

  // Keyboard navigation helper for interactive SVG elements
  const makeKeyboardInteractive = (action) => ({
    tabIndex: 0,
    role: "button",
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
      }
    }
  });

  const getSectionColor = (secId) => {
    if (secId === 'Sec-108' || secId === 'Sec-East') {
      if (isPowerOffline) return 'rgba(75, 85, 99, 0.15)'; // Greyed out offline color
    }
    
    if (mapRouting.highlightedSections.includes(secId)) {
      if (secId === 'Sec-108') return 'rgba(239, 68, 68, 0.2)';
      return 'var(--color-cyan-glow-alpha)';
    }

    if (secId === 'Sec-South') {
      return gates.C.scannerStatus === 'Error' ? 'rgba(239, 68, 68, 0.08)' : 'var(--section-bg-default)';
    }
    return 'var(--section-bg-default)';
  };

  const getGateColor = (gateKey) => {
    const gate = gates[gateKey];
    if (gate.scannerStatus === 'Error') return 'var(--color-red)';
    if (gate.queue > 80) return 'var(--color-amber)';
    return 'var(--color-cyan)';
  };

  // Generate dynamic crowd density particles for sections
  const crowdParticles = useMemo(() => {
    const particles = [];
    const sections = [
      { id: 'north', cx: 300, cy: 110, rx: 130, ry: 20, density: 0.62 },
      { id: 'south', cx: 300, cy: 350, rx: 130, ry: 20, density: gates.C.scannerStatus === 'Error' ? 0.95 : 0.84 },
      { id: 'west', cx: 115, cy: 230, rx: 20, ry: 70, density: 0.7 },
      { id: 'east', cx: 485, cy: 230, rx: 20, ry: 70, density: isPowerOffline ? 0.1 : 0.78 }, // sparse particles if offline
    ];

    sections.forEach(sec => {
      const count = Math.floor(sec.density * 15);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.8;
        particles.push({
          key: `${sec.id}-${i}`,
          cx: sec.cx + Math.cos(angle) * sec.rx * r,
          cy: sec.cy + Math.sin(angle) * sec.ry * r,
          r: Math.random() * 1.5 + 0.5,
          opacity: sec.density * (0.3 + Math.random() * 0.4),
          color: sec.density > 0.9 ? 'var(--color-red)' : sec.density > 0.75 ? 'var(--color-amber)' : 'var(--color-cyan)',
          delay: Math.random() * 3,
        });
      }
    });
    return particles;
  }, [gates.C.scannerStatus, isPowerOffline]);

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="section-header">
          <span className="pulse-dot-cyan" /> TELEMETRY GRID
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)' }} /> NOMINAL
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-amber)' }} /> CAUTION
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-red)' }} /> CRITICAL
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            600×460
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 600 460" className="map-svg" aria-label="Smart Stadium Interactive Telemetry Grid">
          <defs aria-hidden="true">
            <filter id="glow-effect" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <radialGradient id="pitchGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--bg-primary)" />
            </radialGradient>
            
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-cyan)" />
              <stop offset="100%" stopColor="var(--color-blue)" />
            </linearGradient>

            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-red)" />
              <stop offset="100%" stopColor="var(--color-rose)" />
            </linearGradient>
            
            <radialGradient id="heatmap-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>
            
            <radialGradient id="heatmap-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </radialGradient>
          </defs>

          {/* Blueprint Grid */}
          <g stroke="rgba(255, 255, 255, 0.015)" strokeWidth="0.5" aria-hidden="true">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={460} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1={0} y1={i * 50} x2={600} y2={i * 50} />
            ))}
          </g>

          {/* Outer Structure Rings */}
          <ellipse cx="300" cy="230" rx="270" ry="200" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="2" aria-hidden="true" />
          <ellipse cx="300" cy="230" rx="250" ry="180" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" strokeDasharray="4,6" aria-hidden="true" />
          <ellipse cx="300" cy="230" rx="230" ry="160" fill="none" stroke="rgba(255,255,255,0.008)" strokeWidth="1" strokeDasharray="2,8" aria-hidden="true" />

          {/* Heatmap Overlays (crowd density blobs) */}
          {gates.C.scannerStatus === 'Error' && (
            <ellipse cx="300" cy="370" rx="80" ry="40" fill="url(#heatmap-red)" style={{ animation: 'heatmap-pulse 3s ease-in-out infinite' }} aria-hidden="true" />
          )}
          {incidents.find(i => i.id === 'incident-medical-108') && (
            <ellipse cx="460" cy="220" rx="50" ry="50" fill="url(#heatmap-red)" style={{ animation: 'heatmap-pulse 2.5s ease-in-out infinite' }} aria-hidden="true" />
          )}

          {/* SEATING SECTORS */}
          {/* North Tier */}
          <path 
            d="M 130 130 Q 300 45 470 130 L 435 155 Q 300 80 165 155 Z" 
            fill={getSectionColor('Sec-North')} 
            stroke={mapRouting.highlightedSections.includes('Sec-North') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)'} 
            strokeWidth="1" 
            className="stadium-section"
            onClick={() => setSelectedElement({ type: 'stand', name: 'North Stand (Sec 300-312)', details: 'Telemetry: 62% capacity. Flow rate: nominal. All concourse exits clear.' })}
            {...makeKeyboardInteractive(() => setSelectedElement({ type: 'stand', name: 'North Stand (Sec 300-312)', details: 'Telemetry: 62% capacity. Flow rate: nominal. All concourse exits clear.' }))}
            aria-label="North Stand (Sections 300 to 312). Status nominal. Occupancy: 62 percent."
          />

          {/* South Tier */}
          <path 
            d="M 130 330 Q 300 415 470 330 L 435 305 Q 300 380 165 305 Z" 
            fill={getSectionColor('Sec-South')} 
            stroke={mapRouting.highlightedSections.includes('Sec-South') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)'} 
            strokeWidth="1" 
            className="stadium-section"
            onClick={() => setSelectedElement({ type: 'stand', name: 'South Stand (Sec 100-112)', details: `Telemetry: 84% capacity. ${gates.C.scannerStatus === 'Error' ? 'ALERT: South exits congested — Gate C scanner breakdown.' : 'Flow rate: nominal.'}` })}
            {...makeKeyboardInteractive(() => setSelectedElement({ type: 'stand', name: 'South Stand (Sec 100-112)', details: `Telemetry: 84% capacity. ${gates.C.scannerStatus === 'Error' ? 'ALERT: South exits congested — Gate C scanner breakdown.' : 'Flow rate: nominal.'}` }))}
            aria-label={`South Stand (Sections 100 to 112). Occupancy: 84 percent. ${gates.C.scannerStatus === 'Error' ? 'Warning: Congestion due to Gate C scanner breakdown.' : 'Status nominal.'}`}
          />

          {/* West Tier */}
          <path 
            d="M 130 130 Q 45 230 130 330 L 165 305 Q 90 230 165 155 Z" 
            fill={getSectionColor('Sec-West')} 
            stroke={mapRouting.highlightedSections.includes('Sec-West') ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)'} 
            strokeWidth="1" 
            className="stadium-section"
            onClick={() => setSelectedElement({ type: 'stand', name: 'West Stand (Sec 200-212)', details: 'Telemetry: 70% capacity. Flow rate: nominal.' })}
            {...makeKeyboardInteractive(() => setSelectedElement({ type: 'stand', name: 'West Stand (Sec 200-212)', details: 'Telemetry: 70% capacity. Flow rate: nominal.' }))}
            aria-label="West Stand (Sections 200 to 212). Status nominal. Occupancy: 70 percent."
          />

          {/* East Tier */}
          <path 
            d="M 470 130 Q 555 230 470 330 L 435 305 Q 510 230 435 155 Z" 
            fill={getSectionColor('Sec-108') || getSectionColor('Sec-East')} 
            stroke={isPowerOffline ? 'var(--color-red)' : mapRouting.highlightedSections.includes('Sec-108') ? 'var(--color-red)' : 'rgba(255,255,255,0.05)'} 
            strokeWidth={isPowerOffline ? "2" : "1"} 
            strokeDasharray={isPowerOffline ? "4,4" : "0"}
            className="stadium-section"
            onClick={() => setSelectedElement({ type: 'stand', name: 'East Stand (Sec 102-114)', details: isPowerOffline ? 'ALERT: Quadrant auxiliary power grid failure. Telemetry sensors offline.' : `Telemetry: 78% capacity. ${incidents.find(i=>i.id==='incident-medical-108') ? 'ALERT: Emergency responders active in Section 108.' : 'Flow rate: nominal.'}` })}
            {...makeKeyboardInteractive(() => setSelectedElement({ type: 'stand', name: 'East Stand (Sec 102-114)', details: isPowerOffline ? 'ALERT: Quadrant auxiliary power grid failure. Telemetry sensors offline.' : `Telemetry: 78% capacity. ${incidents.find(i=>i.id==='incident-medical-108') ? 'ALERT: Emergency responders active in Section 108.' : 'Flow rate: nominal.'}` }))}
            aria-label={`East Stand (Sections 102 to 114). Occupancy: 78 percent. ${isPowerOffline ? 'Critical warning: Power grid failure, telemetry sensors offline.' : incidents.find(i=>i.id==='incident-medical-108') ? 'Alert: Emergency medical responders active in Section 108.' : 'Status nominal.'}`}
          />

          {/* Pitch */}
          <rect x="230" y="170" width="140" height="90" rx="4" fill="url(#pitchGrad)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" aria-hidden="true" />
          <ellipse cx="300" cy="215" rx="20" ry="20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" aria-hidden="true" />
          <line x1="230" y1="215" x2="370" y2="215" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" aria-hidden="true" />
          
          {/* Goal boxes */}
          <rect x="230" y="195" width="20" height="40" rx="1" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" aria-hidden="true" />
          <rect x="350" y="195" width="20" height="40" rx="1" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" aria-hidden="true" />

          {/* Crowd Density Particles */}
          {crowdParticles.map(p => (
            <circle 
              key={p.key} 
              cx={p.cx} 
              cy={p.cy} 
              r={p.r} 
              fill={p.color} 
              opacity={p.opacity}
              aria-hidden="true"
              style={{ animation: `breathe ${3 + p.delay}s ease-in-out infinite`, animationDelay: `${p.delay}s` }}
            />
          ))}

          {/* Dynamic AI Reroute Paths */}
          {mapRouting.suggestedRoutes.includes('GateC-to-GateD') && (
            <path 
              d="M 300 365 C 220 365 195 340 175 305" 
              fill="none" 
              stroke="url(#cyanGrad)" 
              strokeWidth="2.5" 
              strokeDasharray="5,4" 
              className="animated-route"
              filter="url(#glow-effect)"
              aria-label="Pedestrian evacuation route from Gate C to Gate D"
            />
          )}
          {mapRouting.suggestedRoutes.includes('GateC-to-GateB') && (
            <path 
              d="M 300 365 C 380 365 405 340 425 305" 
              fill="none" 
              stroke="url(#cyanGrad)" 
              strokeWidth="2.5" 
              strokeDasharray="5,4" 
              className="animated-route"
              filter="url(#glow-effect)"
              aria-label="Pedestrian evacuation route from Gate C to Gate B"
            />
          )}

          {/* Concession Nodes */}
          {[
            { cx: 200, cy: 310, label: 'F1', status: state.concessions[0]?.stockLevel > 30 ? 'ok' : 'low' },
            { cx: 260, cy: 330, label: 'F2', status: state.concessions[1]?.stockLevel > 20 ? 'ok' : 'low' },
            { cx: 380, cy: 290, label: 'F3', status: 'ok' },
            { cx: 420, cy: 310, label: 'F4', status: 'ok' },
          ].map((node, i) => (
            <g 
              key={`food-${i}`} 
              style={{ cursor: 'pointer' }} 
              onClick={() => setSelectedElement({ type: 'stand', name: state.concessions[i]?.name || 'Concession', details: `Wait: ${state.concessions[i]?.waitTime}min | Stock: ${state.concessions[i]?.stockLevel}%` })}
              {...makeKeyboardInteractive(() => setSelectedElement({ type: 'stand', name: state.concessions[i]?.name || 'Concession', details: `Wait: ${state.concessions[i]?.waitTime}min | Stock: ${state.concessions[i]?.stockLevel}%` }))}
              aria-label={`${state.concessions[i]?.name || 'Concession food stall'}. Wait time is ${state.concessions[i]?.waitTime} minutes. Stock level is ${state.concessions[i]?.stockLevel} percent.`}
            >
              <rect x={node.cx - 8} y={node.cy - 8} width="16" height="16" rx="3" fill={node.status === 'low' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)'} stroke={node.status === 'low' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.5" />
              <text x={node.cx} y={node.cy + 3} fill={node.status === 'low' ? 'var(--color-amber)' : 'var(--text-secondary)'} fontSize="7" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="600">{node.label}</text>
            </g>
          ))}

          {/* GATES */}
          {[
            { key: 'A', cx: 300, cy: 25, label: 'GATE A', labelY: 8 },
            { key: 'B', cx: 565, cy: 215, label: 'GATE B', labelY: 196 },
            { key: 'C', cx: 300, cy: 410, label: 'GATE C', labelY: 432 },
            { key: 'D', cx: 35, cy: 215, label: 'GATE D', labelY: 196 },
          ].map(gate => {
            const color = getGateColor(gate.key);
            const isError = gates[gate.key].scannerStatus === 'Error';
            
            return (
              <g 
                key={gate.key} 
                className="stadium-gate" 
                style={{ cursor: 'pointer' }} 
                onClick={() => setSelectedElement({ type: 'gate', key: gate.key, ...gates[gate.key] })}
                {...makeKeyboardInteractive(() => setSelectedElement({ type: 'gate', key: gate.key, ...gates[gate.key] }))}
                aria-label={`${gate.label}. Queue size: ${gates[gate.key].queue} fans. Flow rate: ${gates[gate.key].flowRate} per minute. Scanner status: ${gates[gate.key].scannerStatus}.`}
              >
                {/* Outer glow ring */}
                <circle cx={gate.cx} cy={gate.cy} r="18" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" />
                {/* Inner ring */}
                <circle cx={gate.cx} cy={gate.cy} r="12" fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
                {/* Core dot */}
                <circle cx={gate.cx} cy={gate.cy} r="6" fill={color} opacity="0.9" />
                {/* Center highlight */}
                <circle cx={gate.cx} cy={gate.cy} r="2.5" fill="white" opacity="0.6" />
                
                {/* Animated pulse ring for errors */}
                {isError && (
                  <>
                    <circle cx={gate.cx} cy={gate.cy} r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" className="animated-route" style={{ animationDuration: '2s' }} />
                    <circle cx={gate.cx} cy={gate.cy} r="28" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" className="animated-route" style={{ animationDuration: '3s' }} />
                  </>
                )}
                
                {/* Queue count label */}
                <text x={gate.cx} y={gate.cy + 32} fill={color} fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)" opacity="0.75">
                  {gates[gate.key].queue}
                </text>
                
                {/* Gate label */}
                <text x={gate.cx} y={gate.labelY} fill="var(--text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-heading)" letterSpacing="0.06em">
                  {gate.label}
                </text>
              </g>
            );
          })}

          {/* Active Incident Markers */}
          {incidents.map((incident) => {
            const positions = {
              'incident-gate-c': { cx: 300, cy: 375 },
              'incident-taco-stock': { cx: 250, cy: 315 },
              'incident-medical-108': { cx: 455, cy: 205 },
              'incident-storm': { cx: 490, cy: 85 },
              'incident-power': { cx: 470, cy: 175 },
            };
            const pos = positions[incident.id] || { cx: 300, cy: 230 };

            return (
              <g 
                key={incident.id} 
                style={{ cursor: 'pointer' }} 
                onClick={() => setSelectedElement({ type: 'incident', ...incident })}
                {...makeKeyboardInteractive(() => setSelectedElement({ type: 'incident', ...incident }))}
                aria-label={`Critical Incident: ${incident.title}. Location: ${incident.location}. Severity: ${incident.severity}. Description: ${incident.description}.`}
              >
                {/* Incident halo */}
                <circle cx={pos.cx} cy={pos.cy} r="22" fill="none" stroke="var(--color-red)" strokeWidth="0.5" opacity="0.3" className="animated-route" style={{ animationDuration: '3s' }} />
                {/* Background */}
                <circle cx={pos.cx} cy={pos.cy} r="11" fill="var(--bg-primary)" stroke="var(--color-red)" strokeWidth="1.5" />
                {/* Exclamation icon */}
                <path d={`M ${pos.cx} ${pos.cy - 5} L ${pos.cx} ${pos.cy + 1}`} stroke="var(--color-red)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx={pos.cx} cy={pos.cy + 4} r="1" fill="var(--color-red)" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selection Detail Overlay */}
      {selectedElement && (
        <div 
          className="glass-panel animate-slide-down" 
          style={{ 
            position: 'absolute', 
            bottom: '12px', left: '12px', right: '12px', 
            padding: '14px 18px', 
            background: 'var(--bg-elevated)',
            border: 'var(--border-glass)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
            zIndex: 5,
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-cyan)' }}>
              {selectedElement.type.toUpperCase()} // {selectedElement.name || selectedElement.title}
            </span>
            <button 
              onClick={() => setSelectedElement(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', borderRadius: '4px' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-bright)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >
              ✕
            </button>
          </div>
          
          {selectedElement.type === 'gate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <div>QUEUE: <span style={{ color: selectedElement.queue > 80 ? 'var(--color-red)' : 'var(--text-bright)', fontWeight: 700 }}>{selectedElement.queue} fans</span></div>
              <div>SCANNER: <span style={{ color: selectedElement.scannerStatus === 'Error' ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 700 }}>{selectedElement.scannerStatus}</span></div>
              <div>CAPACITY: <span style={{ fontWeight: 700 }}>{selectedElement.capacityRate}%</span></div>
              <div>FLOW: <span style={{ fontWeight: 700 }}>{selectedElement.flowRate} fans/min</span></div>
              {selectedElement.failCode !== "NOMINAL" && (
                <div style={{ gridColumn: 'span 2', color: 'var(--color-red)' }}>FAIL CODE: {selectedElement.failCode}</div>
              )}
            </div>
          )}

          {selectedElement.type === 'stand' && (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '11.5px' }}>{selectedElement.details}</div>
          )}

          {selectedElement.type === 'incident' && (
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                SEVERITY: <span style={{ color: 'var(--color-red)', fontWeight: 700 }}>{selectedElement.severity}</span>
              </div>
              <div style={{ color: 'var(--text-primary)', lineHeight: 1.4, fontSize: '11.5px' }}>{selectedElement.description}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                Zone: {selectedElement.location} | Time: {selectedElement.timestamp}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
