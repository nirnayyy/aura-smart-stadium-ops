import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket as TicketIcon, ShoppingBag, MessageSquare, Compass, 
  Send, MapPin, Award, Navigation, 
  Wifi, Battery, Train
} from 'lucide-react';
import { addLog } from '../utils/simulationEngine';
import { askGemini, isGeminiConfigured } from '../utils/geminiService';

// Utility for input sanitization to prevent injection and XSS
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 150); // Bound length check
}

export default function FanApp({ state, aiData, updateState }) {
  const [activeTab, setActiveTab] = useState('ticket');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'AI', text: "Welcome to AURA. I'm your intelligent stadium companion for the FIFA World Cup Final. Ask me about gates, seating, food, or weather — I'll optimize your experience in real-time.", time: '19:40' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Customization toppings modal state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  
  // Active pre-orders state
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Order progress simulation
  useEffect(() => {
    let timer;
    if (activeOrder && orderProgress < 100) {
      timer = setTimeout(() => {
        setOrderProgress(prev => Math.min(100, prev + 25));
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [activeOrder, orderProgress]);

  const initiateCustomizer = (item) => {
    setCustomizingItem(item);
    setSelectedToppings(item.category === 'Food' ? ['Cheese', 'Lettuce'] : ['Ice']);
  };

  const toggleTopping = (topping) => {
    setSelectedToppings(prev => 
      prev.includes(topping) ? prev.filter(t => t !== topping) : [...prev, topping]
    );
  };

  const handleOrder = () => {
    if (!customizingItem) return;
    if (customizingItem.stockLevel <= 0) return;
    
    let priceMultiplier = Number(aiData?.pricingAdjustments[customizingItem.id] || 1.0);
    // Security pricing guard
    if (isNaN(priceMultiplier) || priceMultiplier < 0.1 || priceMultiplier > 10.0) {
      priceMultiplier = 1.0;
    }
    const finalPrice = (customizingItem.price * priceMultiplier).toFixed(2);

    const safeToppings = Array.isArray(selectedToppings)
      ? selectedToppings.slice(0, 10).map(t => sanitizeInput(t))
      : [];

    setActiveOrder({
      itemName: customizingItem.popularItem,
      concessionName: customizingItem.name,
      toppings: safeToppings,
      price: finalPrice
    });
    setOrderProgress(0);
    
    const tempState = JSON.parse(JSON.stringify(state));
    addLog(tempState, "TRANSIT", "Fan App", `Mobile pre-order: ${customizingItem.popularItem} (+${safeToppings.join(', ')}) from ${customizingItem.name} confirmed.`);
    updateState(tempState);
    setCustomizingItem(null);
  };

  const sendFanMessage = async (text) => {
    const sanitized = sanitizeInput(text);
    if (!sanitized) return;

    const newMessages = [...chatMessages, { sender: 'User', text: sanitized, time: new Date().toTimeString().slice(0, 5) }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsTyping(true);

    if (isGeminiConfigured()) {
      try {
        const reply = await askGemini(sanitized, state);
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'AI', text: reply, time: new Date().toTimeString().slice(0, 5) }]);
        return;
      } catch (err) {
        console.warn("Gemini API error, falling back to heuristics:", err);
      }
    }

    // Heuristics Fallback Engine
    setTimeout(() => {
      let responseText = "Accessing AURA telemetry...";
      const query = sanitized.toLowerCase();
      
      if (query.includes('seat') || query.includes('get to') || query.includes('find my')) {
        responseText = "📍 Seating coordinates: Section 108, Row K, Seat 14.\n\nPath suggestion: Enter through Gate B (East) -> walk 15m straight -> take Escalator 4 up to Concourse 100 -> Section 108 corridor will be on your left. Corridor is clear, ETA: 3 minutes.";
      } else if (query.includes('gate') || query.includes('crowd') || query.includes('busy')) {
        const bestGate = Object.keys(state.gates)
          .filter(k => state.gates[k].scannerStatus === 'Online')
          .sort((a, b) => state.gates[a].queue - state.gates[b].queue)[0];
        responseText = `🚶 Live Gate Telemetry:\n\n• Gate C: ${state.gates.C.queue} queued ${state.gates.C.scannerStatus === 'Error' ? '(⚠️ SCANNERS OFFLINE - REDIRECTING)' : ''}\n• Gate ${bestGate}: Only ${state.gates[bestGate].queue} fans queued.\n\nWe recommend using Gate ${bestGate} for fastest access. Follow digital perimeter signs.`;
      } else if (query.includes('food') || query.includes('eat') || query.includes('hungry') || query.includes('fast')) {
        const fastestStand = [...state.concessions].sort((a, b) => a.waitTime - b.waitTime)[0];
        responseText = `🍔 Recommended Fast Option:\n\n**${fastestStand.name}**\n• Item: ${fastestStand.popularItem}\n• Wait time: ~${fastestStand.waitTime} min\n• Stock level: ${fastestStand.stockLevel}%\n\nTap the Food tab below to customize, pre-order, and skip the line!`;
      } else if (query.includes('weather') || query.includes('rain') || query.includes('storm')) {
        if (state.matchInfo.weatherPhase === 'Storm') {
          responseText = "⛈️ Severe Storm Notice:\n\n• Ridesharing suspended due to lightning strikes.\n• Subway lines running at maximum capacity.\n• Stay in covered lounge areas.\n• ETA to clear: ~25 mins.\n\nEnjoy dynamic 50% discount vouchers on all beverages at atrium cafes while you shelter.";
        } else {
          responseText = `☀️ Current weather: ${state.matchInfo.weather}.\nNo weather alerts active. Enjoy the match!`;
        }
      } else if (query.includes('transit') || query.includes('train') || query.includes('subway') || query.includes('uber')) {
        responseText = `🚇 Transit Schedule:\n\n• Metro Green: Next in ${state.transit.metroGreen.nextArrivalMin} mins (${state.transit.metroGreen.crowdLevel} load)\n• Metro Yellow: Next in ${state.transit.metroYellow.nextArrivalMin} mins\n• Rideshare Hub: ${state.transit.rideshareZone.status === 'Suspended' ? '⚠️ TEMPORARILY SUSPENDED (LIGHTNING)' : `Wait time: ~${state.transit.rideshareZone.waitTimeMin} mins`}`;
      } else if (query.includes('discount') || query.includes('coupon') || query.includes('deal')) {
        const discountedStalls = state.concessions.filter(c => (aiData?.pricingAdjustments[c.id] || 1.0) < 1.0);
        if (discountedStalls.length > 0) {
          responseText = `🎁 Dynamic AI Vouchers Active:\n\n` + discountedStalls.map(s => {
            const disc = Math.round((1 - (aiData?.pricingAdjustments[s.id] || 1.0)) * 100);
            return `• **${s.name}**: ${disc}% OFF your order of ${s.popularItem}!`;
          }).join('\n');
        } else {
          responseText = "No Dynamic Vouchers active at this moment. Vouchers are triggered dynamically to balance stadium crowd queues.";
        }
      } else {
        responseText = "I can assist you with:\n• 📍 \"How do I get to my seat?\"\n• 🚪 \"Which gate is least busy?\"\n• 🍔 \"Where can I get food fast?\"\n• 🚇 \"What's the transit schedule?\"\n• 🎁 \"Are there any coupons active?\"";
      }

      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: 'AI', text: responseText, time: new Date().toTimeString().slice(0, 5) }]);
    }, 1000 + Math.random() * 500);
  };

  const getOrderStatusText = () => {
    if (orderProgress === 0) return "Order Sent";
    if (orderProgress === 25) return "Preparing Ingredients";
    if (orderProgress === 50) return "Chef Over Grill";
    if (orderProgress === 75) return "Packaging Order";
    return "Ready for Pickup";
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      padding: '12px 0'
    }}>
      {/* PHONE SHELL */}
      <div className="phone-shell">
        
        {/* Dynamic Island Notch */}
        <div className="phone-notch">
          <div className="phone-notch-pill" />
        </div>

        {/* Status Bar */}
        <div className="phone-status-bar">
          <span style={{ fontWeight: 700 }}>19:45</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wifi size={10} />
            <span style={{ fontSize: '9px', fontWeight: 700 }}>5G</span>
            <Battery size={12} />
          </div>
        </div>

        {/* Match Header */}
        <div style={{
          background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          padding: '14px 20px 12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={9} style={{ color: 'var(--color-cyan)' }} /> METLIFE STADIUM
            </span>
            <span style={{ color: 'var(--color-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-green)', animation: 'pulse-cyan 2s infinite' }} />
              LIVE
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'var(--font-heading)' }}>ARGENTINA</div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '1px', letterSpacing: '0.1em' }}>ARG</div>
            </div>
            
            <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '5px 16px', borderRadius: 'var(--radius-pill)', border: 'var(--border-glass)' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--color-cyan)' }}>
                {state.matchInfo.score}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>{state.matchInfo.minute}'</div>
            </div>

            <div style={{ textAlign: 'center', width: '30%' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'var(--font-heading)' }}>FRANCE</div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '1px', letterSpacing: '0.1em' }}>FRA</div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          
          {/* Active Notification Alerts */}
          {aiData?.fanAlerts.map((alert, idx) => (
            <div 
              key={`alert-${idx}`} 
              role="alert"
              aria-live="assertive"
              className="glass-panel-cyan animate-slide-down" 
              style={{ 
                padding: '12px 14px', marginBottom: '14px', 
                boxShadow: '0 4px 16px var(--pulse-cyan-glow-start)',
                fontSize: '11px', borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', fontSize: '10px' }}>
                <Navigation size={10} aria-hidden="true" /> {alert.title}
              </div>
              <div style={{ color: 'var(--text-primary)', lineHeight: 1.4, fontSize: '10.5px' }}>{alert.message}</div>
            </div>
          ))}

          {/* ===== TICKET TAB ===== */}
          {activeTab === 'ticket' && (
            <div id="tabpanel-ticket" role="tabpanel" aria-labelledby="tab-ticket" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Premium Holographic Ticket */}
              <div className="glass-panel hologram-ticket" style={{ 
                padding: '22px 18px', borderRadius: 'var(--radius-lg)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>FIFA WORLD CUP FINAL 2026</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '3px', fontFamily: 'var(--font-heading)' }}>MATCH 64</div>
                  </div>
                  <span style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-amber))', color: '#000', fontSize: '8px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Award size={9} /> CATEGORY 1
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '22px' }}>
                  {[
                    { label: 'SECTION', value: '108', color: 'var(--color-cyan)' },
                    { label: 'ROW', value: 'K', color: 'var(--text-bright)' },
                    { label: 'SEAT', value: '14', color: 'var(--text-bright)' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: item.color, marginTop: '2px', fontFamily: 'var(--font-heading)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Simulated barcode */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: 'var(--radius-sm)', border: 'var(--border-glass)' }}>
                  {/* barcode lines */}
                  <div style={{ width: '100%', height: '42px', background: 'repeating-linear-gradient(90deg, var(--text-primary) 0px, var(--text-primary) 2px, transparent 2px, transparent 6px, var(--text-primary) 6px, var(--text-primary) 8px, transparent 8px, transparent 12px)' }} />
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3em' }}>
                    *FIFA2026-64-SEC108K14*
                  </div>
                </div>
              </div>

              {/* Wayfinding Mini Info */}
              <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={12} style={{ color: 'var(--color-cyan)' }} /> WAYFINDING ASSIST
                </div>
                <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Enter via **Gate B (East)**. Optimal route is clear. Estimated walking time to Section 108 is **3 minutes**.
                </p>
                <button 
                  className="mode-btn active" 
                  style={{ width: '100%', padding: '8px 0', fontSize: '10px', justifyContent: 'center', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}
                  onClick={() => setActiveTab('wayfinding')}
                >
                  Open Directional Radar
                </button>
              </div>

              {/* Fan Loyalty Points Progress Bar */}
              <div className="glass-panel" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>LOYALTY STATUS</span>
                  <span style={{ color: 'var(--color-gold)' }}>GOLD LEVEL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>
                  <span>780 Points</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 400 }}>next reward at 1000 pts</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '78%' }} />
                </div>
              </div>

            </div>
          )}

          {/* ===== WAYFINDING TAB ===== */}
          {activeTab === 'wayfinding' && (
            <div id="tabpanel-wayfinding" role="tabpanel" aria-labelledby="tab-wayfinding" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="glass-panel" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={12} style={{ color: 'var(--color-cyan)' }} /> WAYFINDING ROUTING
                  </span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>GPS STABLE</span>
                </div>

                {/* Map Radar visual mock */}
                <div style={{
                  height: '180px',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-glass)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Radar sweep lines */}
                  <div style={{ width: '130px', height: '130px', border: '1px solid var(--color-cyan-glow-alpha)', borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <div style={{ width: '80px', height: '80px', border: '1px dashed var(--color-cyan-glow-alpha)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: 'var(--color-cyan)', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px var(--color-cyan)' }} />
                    <div style={{ position: 'absolute', top: '25%', left: '75%', width: '5px', height: '5px', background: 'var(--color-red)', borderRadius: '50%' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    METLIFE STADIUM LEVEL 100
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {[
                    { title: "Enter via Gate B", desc: "Scan ticket on scanner kiosk 4", status: "completed" },
                    { title: "Concourse East corridor", desc: "Walk 45 meters forward to Staircase 4", status: "active" },
                    { title: "Arrive at Sec 108", desc: "Proceed to Row K Seat 14", status: "pending" }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '10.5px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ 
                          width: '10px', height: '10px', borderRadius: '50%', 
                          background: step.status === 'completed' ? 'var(--color-green)' : step.status === 'active' ? 'var(--color-cyan)' : 'transparent',
                          border: '1px solid var(--text-muted)'
                        }} />
                        {idx < 2 && <span style={{ width: '1px', flex: 1, background: 'var(--text-muted)', margin: '2px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: step.status === 'active' ? 'var(--color-cyan)' : 'var(--text-primary)' }}>{step.title}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Transit Schedule Board */}
              <div className="glass-panel" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Train size={12} style={{ color: 'var(--color-cyan)' }} /> METRO TRANSIT BOARD
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'var(--color-green)' }}>METRO GREEN</span>
                    <span>{state.transit.metroGreen.nextArrivalMin} mins</span>
                    <span style={{ color: 'var(--text-muted)' }}>{state.transit.metroGreen.crowdLevel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'var(--color-amber)' }}>METRO YELLOW</span>
                    <span>{state.transit.metroYellow.nextArrivalMin} mins</span>
                    <span style={{ color: 'var(--text-muted)' }}>{state.transit.metroYellow.crowdLevel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span>UBER/LYFT HUB</span>
                    <span style={{ color: state.transit.rideshareZone.status === 'Suspended' ? 'var(--color-red)' : 'var(--text-primary)' }}>
                      {state.transit.rideshareZone.status === 'Suspended' ? 'SUSPENDED' : `${state.transit.rideshareZone.waitTimeMin}m wait`}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{state.transit.rideshareZone.crowdLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CONCESSIONS TAB ===== */}
          {activeTab === 'concessions' && (
            <div id="tabpanel-concessions" role="tabpanel" aria-labelledby="tab-concessions" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              
              {/* Order Customizer Overlay Modal */}
              {customizingItem && (
                <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--color-cyan)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-cyan)' }}>
                      CUSTOMIZE: {customizingItem.popularItem}
                    </span>
                    <button 
                      onClick={() => setCustomizingItem(null)}
                      aria-label="Close Customizer"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Select toppings or additions:
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {customizingItem.category === 'Food' ? (
                      ['Cheese', 'Lettuce', 'Bacon', 'Onion', 'Spicy Salsa'].map(top => (
                        <button
                          key={top}
                          onClick={() => toggleTopping(top)}
                          aria-pressed={selectedToppings.includes(top)}
                          aria-label={`Toggle ${top} topping`}
                          style={{
                            padding: '4px 10px', fontSize: '9px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-pill)',
                            background: selectedToppings.includes(top) ? 'var(--color-cyan)' : 'transparent',
                            color: selectedToppings.includes(top) ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {top}
                        </button>
                      ))
                    ) : (
                      ['Ice', 'Extra Shot', 'Lime Slice'].map(top => (
                        <button
                          key={top}
                          onClick={() => toggleTopping(top)}
                          aria-pressed={selectedToppings.includes(top)}
                          aria-label={`Toggle ${top} topping`}
                          style={{
                            padding: '4px 10px', fontSize: '9px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-pill)',
                            background: selectedToppings.includes(top) ? 'var(--color-cyan)' : 'transparent',
                            color: selectedToppings.includes(top) ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {top}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    className="mode-btn active"
                    style={{ width: '100%', padding: '8px 0', fontSize: '10px', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}
                    onClick={handleOrder}
                  >
                    Confirm Pre-Order
                  </button>
                </div>
              )}

              {/* Active Pre-order progress tracker */}
              {activeOrder && (
                <div className="glass-panel" style={{ padding: '14px 18px', border: 'var(--border-glow-cyan)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-cyan)' }}>ACTIVE MOBILE ORDER</span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PICKUP AT COUNTER 3</span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{activeOrder.itemName}</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeOrder.concessionName} // +{activeOrder.toppings.join(', ')}
                  </div>

                  {/* Progress fill */}
                  <div className="progress-bar" style={{ margin: '14px 0 8px 0' }}>
                    <div className="progress-fill" style={{ width: `${orderProgress}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{getOrderStatusText()}</span>
                    <span>{orderProgress}% Complete</span>
                  </div>

                  {orderProgress === 100 && (
                    <button 
                      className="mode-btn" 
                      style={{ width: '100%', padding: '6px 0', fontSize: '9px', background: 'var(--color-green)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', marginTop: '10px', justifyContent: 'center' }}
                      onClick={() => setActiveOrder(null)}
                    >
                      Clear Pickup Code
                    </button>
                  )}
                </div>
              )}

              {/* Food menu list */}
              <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={12} style={{ color: 'var(--color-cyan)' }} /> DIGITAL STALLS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {state.concessions.map(con => {
                  const multiplier = aiData?.pricingAdjustments[con.id] || 1.0;
                  const finalPrice = (con.price * multiplier).toFixed(2);
                  const isDiscounted = multiplier < 1.0;
                  const isSurged = multiplier > 1.0;

                  return (
                    <div 
                      key={con.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '12px 14px', 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 80px', 
                        alignItems: 'center', 
                        gap: '10px',
                        border: isDiscounted ? '1px solid rgba(16, 185, 129, 0.18)' : isSurged ? '1px solid rgba(239, 68, 68, 0.15)' : 'var(--border-glass)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '11.5px', color: 'var(--text-bright)' }}>{con.popularItem}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>{con.name}</div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                          <span>Wait: {con.waitTime}m</span>
                          <span>Stock: {con.stockLevel}%</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>
                          ${finalPrice}
                          {isDiscounted && (
                            <span style={{ color: 'var(--color-green)', fontSize: '8px', marginLeft: '4px', verticalAlign: 'top' }}>
                              -{Math.round((1 - multiplier) * 100)}%
                            </span>
                          )}
                        </div>
                        <button
                          className="mode-btn active"
                          style={{ padding: '4px 10px', fontSize: '9px', borderRadius: '4px' }}
                          onClick={() => initiateCustomizer(con)}
                          disabled={con.stockLevel <= 0}
                          aria-label={con.stockLevel <= 0 ? `${con.popularItem} from ${con.name} is Sold Out` : `Pre-order ${con.popularItem} from ${con.name}`}
                        >
                          {con.stockLevel <= 0 ? 'SOLD OUT' : 'Pre-order'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ===== CHAT TAB ===== */}
          {activeTab === 'chat' && (
            <div id="tabpanel-chat" role="tabpanel" aria-labelledby="tab-chat" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Messages list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '10px' }}>
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'User';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        borderBottomRightRadius: isUser ? '2px' : '12px',
                        borderBottomLeftRadius: isUser ? '12px' : '2px',
                        background: isUser ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.03)',
                        border: isUser ? 'none' : 'var(--border-glass)',
                        color: isUser ? '#fff' : 'var(--text-primary)',
                        fontSize: '11px',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-line'
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                        {msg.time}
                      </span>
                    </div>
                  );
                })}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border-glass)', padding: '8px 12px', borderRadius: '12px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    AURA typing...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Quick Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {[
                  "Where is Section 108?",
                  "Which gate is fastest?",
                  "Any dynamic discounts?"
                ].map(action => (
                  <button
                    key={action}
                    onClick={() => sendFanMessage(action)}
                    style={{
                      padding: '4px 8px', fontSize: '9px', borderRadius: '4px', border: 'var(--border-glass)',
                      background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--text-bright)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                  >
                    {action}
                  </button>
                ))}
              </div>

              {/* Input box */}
              <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                <input 
                  type="text" 
                  aria-label="Ask AURA Smart Stadium Companion"
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendFanMessage(chatInput); }}
                  placeholder="Ask AURA Companion..." 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '11px', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button 
                  className="mode-btn active"
                  aria-label="Send message to AI companion"
                  style={{ padding: '0 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => sendFanMessage(chatInput)}
                >
                  <Send size={11} aria-hidden="true" />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM TAB MENU SWITCHER */}
        <div className="phone-tab-bar" role="tablist" aria-label="Fan app sections">
          {[
            { id: 'ticket', icon: <TicketIcon size={16} />, label: 'TICKET' },
            { id: 'wayfinding', icon: <Compass size={16} />, label: 'WAYFINDING' },
            { id: 'concessions', icon: <ShoppingBag size={16} />, label: 'FOOD' },
            { id: 'chat', icon: <MessageSquare size={16} />, label: 'AI COMPANION' },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`phone-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
