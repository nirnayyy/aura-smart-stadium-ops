/**
 * AURA Stadium Telemetry & Simulation Engine
 * @module simulationEngine
 * @description Tracks match-day telemetry, crowd density, sentiment, concession supply levels, transit, and active incidents.
 */

/**
 * Default stadium telemetry state for the FIFA World Cup 2026 final simulation.
 * @type {Object}
 */
export const INITIAL_STADIUM_STATE = {
  matchInfo: {
    title: "Argentina vs. France",
    phase: "FIFA World Cup Final 2026",
    score: "2 - 1",
    minute: 74,
    second: 0,
    attendance: 87400,
    maxCapacity: 90000,
    weather: "Clear (24°C)",
    weatherPhase: "Clear", // Clear, Rain, Storm, Windy
    sentiment: 88, // global sentiment index (0-100)
    possession: "ARG 54% - 46% FRA",
    shots: "ARG 11 - 8 FRA",
  },
  gates: {
    A: { name: "Gate A (North)", queue: 15, scannerStatus: "Online", capacityRate: 85, flowRate: 40, failCode: "NOMINAL" },
    B: { name: "Gate B (East)", queue: 28, scannerStatus: "Online", capacityRate: 85, flowRate: 38, failCode: "NOMINAL" },
    C: { name: "Gate C (South)", queue: 145, scannerStatus: "Online", capacityRate: 85, flowRate: 15, failCode: "NOMINAL" },
    D: { name: "Gate D (West)", queue: 32, scannerStatus: "Online", capacityRate: 85, flowRate: 42, failCode: "NOMINAL" },
    VIP: { name: "VIP Executive Gate", queue: 4, scannerStatus: "Online", capacityRate: 99, flowRate: 15, failCode: "NOMINAL" },
  },
  concessions: [
    { id: 1, name: "Section 104 Grill", category: "Food", waitTime: 8, baseWait: 5, stockLevel: 82, priceMultiplier: 1.0, popularItem: "Stadium Burger", price: 12.00 },
    { id: 2, name: "Copa Cabana Tacos", category: "Food", waitTime: 27, baseWait: 10, stockLevel: 45, priceMultiplier: 1.0, popularItem: "Carnitas Taco Trio", price: 14.50 },
    { id: 3, name: "Allez Brew & Beverage", category: "Drinks", waitTime: 12, baseWait: 6, stockLevel: 91, priceMultiplier: 1.0, popularItem: "Golden Lager", price: 9.00 },
    { id: 4, name: "Pampa Ice Cream & Sweets", category: "Dessert", waitTime: 5, baseWait: 4, stockLevel: 68, priceMultiplier: 1.0, popularItem: "Dulce Cone", price: 6.50 },
    { id: 5, name: "Section 218 Express Bites", category: "Food", waitTime: 19, baseWait: 8, stockLevel: 30, priceMultiplier: 1.0, popularItem: "Footlong Hotdog", price: 10.00 },
  ],
  transit: {
    metroGreen: { name: "Green Line (Downtown)", nextArrivalMin: 4, status: "Normal", crowdLevel: "Moderate" },
    metroYellow: { name: "Yellow Line (Express)", nextArrivalMin: 7, status: "Normal", crowdLevel: "Moderate" },
    rideshareZone: { name: "Uber/Lyft Hub C", waitTimeMin: 15, status: "Normal", crowdLevel: "Low" },
  },
  incidents: [],
  logs: [
    { time: "19:15:30", type: "SYSTEM", sender: "Telemetry", message: "AURA operations initialized successfully." },
    { time: "19:16:05", type: "SYSTEM", sender: "Gate A Sensor", message: "Barcode scanner health diagnostics: 100% operational." }
  ],
  simulationSpeed: 1, // 1x, 2x, 5x, 0 (paused)
  restockStatus: "Idle", // Idle, Dispatching, In Progress
};

/**
 * Advances the simulation by one tick, updating clock, queues, concession waits, transit, and sentiment index.
 * @param {Object} state - Current stadium state.
 * @returns {Object} Deep-cloned updated stadium state.
 */
export function tickSimulation(state) {
  const newState = JSON.parse(JSON.stringify(state));

  // 1. Tick game clock (ticks every 5 seconds, representing 30 seconds of match time per tick)
  if (newState.matchInfo.minute < 90) {
    newState.matchInfo.second += 30;
    if (newState.matchInfo.second >= 60) {
      newState.matchInfo.minute += 1;
      newState.matchInfo.second = 0;
    }

    // Interactive score events
    if (newState.matchInfo.minute === 82 && newState.matchInfo.second === 0 && newState.matchInfo.score === "2 - 1") {
      newState.matchInfo.score = "2 - 2";
      addLog(newState, "MATCH", "Match Center", "GOAL! France scores. Kylian Mbappé (82'). Assisted by Antoine Griezmann. Score: 2-2.");
      newState.matchInfo.sentiment = Math.max(20, newState.matchInfo.sentiment - 10); // sentiment changes based on goals
    }
    if (newState.matchInfo.minute === 89 && newState.matchInfo.second === 0 && newState.matchInfo.score === "2 - 2") {
      newState.matchInfo.score = "3 - 2";
      addLog(newState, "MATCH", "Match Center", "GOAL! Argentina scores. Lionel Messi (89') penalty kick. Score: 3-2.");
      newState.matchInfo.sentiment = Math.min(100, newState.matchInfo.sentiment + 15);
    }
  } else {
    // Post match
    newState.matchInfo.phase = "FIFA World Cup Final 2026 — Full Time";
  }

  // 2. Dynamic Weather Transition Lifecycle
  const chance = Math.random();
  if (newState.matchInfo.weatherPhase === "Clear" && chance > 0.96) {
    newState.matchInfo.weatherPhase = "Rain";
    newState.matchInfo.weather = "Rain (18°C)";
    addLog(newState, "WEATHER", "Weather Sensors", "Precipitation detected. Commencing shade shelter signage alerts.");
  } else if (newState.matchInfo.weatherPhase === "Rain" && chance > 0.94) {
    newState.matchInfo.weatherPhase = "Storm";
    newState.matchInfo.weather = "Severe Storm Warning (16°C)";
    newState.gates.C.flowRate = Math.max(5, newState.gates.C.flowRate - 5);
    addLog(newState, "WEATHER", "Weather Sensors", "Severe lightning detected within 5km. Safety egress guidelines activated.");
  } else if (newState.matchInfo.weatherPhase === "Storm" && chance > 0.90) {
    newState.matchInfo.weatherPhase = "Windy";
    newState.matchInfo.weather = "Windy (19°C)";
    addLog(newState, "WEATHER", "Weather Sensors", "Storm cleared. High wind warnings active.");
  } else if (newState.matchInfo.weatherPhase === "Windy" && chance > 0.85) {
    newState.matchInfo.weatherPhase = "Clear";
    newState.matchInfo.weather = "Clear (22°C)";
    addLog(newState, "WEATHER", "Weather Sensors", "All weather warnings cleared.");
  }

  // 3. Simulate Gates queue variations
  Object.keys(newState.gates).forEach(key => {
    const gate = newState.gates[key];
    if (gate.scannerStatus === "Error") {
      gate.flowRate = Math.max(2, gate.flowRate - 1);
      gate.queue += Math.floor(Math.random() * 6) + 4; // Queue builds up fast
      gate.failCode = "ERR_TCP_TIMEOUT_404";
    } else {
      gate.failCode = "NOMINAL";
      const arrivals = Math.floor(Math.random() * 6) + 2;
      const departures = Math.floor(gate.flowRate / 8) + 1;
      gate.queue = Math.max(5, gate.queue + arrivals - departures);
    }
  });

  // 4. Concession wait times scale with game minutes & stock
  const minute = newState.matchInfo.minute;
  const matchPhaseMultiplier = (minute > 40 && minute <= 45) || (minute >= 80) ? 1.9 : 1.0;

  newState.concessions.forEach(item => {
    const stockSpeedPenalty = item.stockLevel < 15 ? 10 : item.stockLevel < 35 ? 5 : 0;
    const dynamicPriceFactor = item.priceMultiplier < 1.0 ? 1.5 : item.priceMultiplier > 1.0 ? 0.7 : 1.0;
    
    const computedWait = Math.round(
      (item.baseWait + stockSpeedPenalty + (Math.random() * 5)) * matchPhaseMultiplier * dynamicPriceFactor
    );
    item.waitTime = Math.max(3, computedWait);

    // Randomly decrease stock slightly
    if (Math.random() > 0.35 && item.stockLevel > 0) {
      item.stockLevel = Math.max(0, item.stockLevel - Math.floor(Math.random() * 3));
    }
  });

  // 5. Restocking Event Cycle
  if (newState.restockStatus === "Dispatching") {
    newState.restockStatus = "In Progress";
    addLog(newState, "SYSTEM", "Logistics Hub", "Restock carts dispatched to depleted stands.");
  } else if (newState.restockStatus === "In Progress") {
    let allRestocked = true;
    newState.concessions.forEach(item => {
      if (item.stockLevel < 40) {
        item.stockLevel = Math.min(100, item.stockLevel + 25);
        allRestocked = false;
      }
    });
    if (allRestocked || Math.random() > 0.7) {
      newState.restockStatus = "Idle";
      addLog(newState, "SYSTEM", "Logistics Hub", "Inventory restocked. Concourse lanes cleared.");
    }
  }

  // 6. Transit arrivals and queueing
  Object.keys(newState.transit).forEach(key => {
    const t = newState.transit[key];
    if (t.nextArrivalMin <= 1) {
      t.nextArrivalMin = Math.floor(Math.random() * 5) + 3; // Reset to 3-8 mins
      addLog(newState, "TRANSIT", t.name, `Train departure sequence completed. Next board in ${t.nextArrivalMin} mins.`);
    } else {
      t.nextArrivalMin -= 1;
    }

    if (newState.matchInfo.weatherPhase === "Storm") {
      t.crowdLevel = "High";
      if (key === "rideshareZone") {
        t.status = "Suspended";
        t.waitTimeMin = 90;
      }
    } else {
      t.crowdLevel = t.nextArrivalMin < 3 ? "High" : "Moderate";
      if (key === "rideshareZone") {
        t.status = "Normal";
        t.waitTimeMin = Math.max(10, Math.floor(Math.random() * 20) + 10);
      }
    }
  });

  // 7. global Fan Sentiment Index calculation
  let sentimentPoints = 90;
  // Negatives
  const activeCriticalAlerts = newState.incidents.filter(i => i.severity === "CRITICAL").length;
  sentimentPoints -= activeCriticalAlerts * 12;

  const lowStockStalls = newState.concessions.filter(c => c.stockLevel < 20).length;
  sentimentPoints -= lowStockStalls * 4;

  const highQueueGates = Object.values(newState.gates).filter(g => g.queue > 100).length;
  sentimentPoints -= highQueueGates * 6;

  if (newState.matchInfo.weatherPhase === "Storm") sentimentPoints -= 15;

  newState.matchInfo.sentiment = Math.max(10, Math.min(100, Math.round(sentimentPoints)));

  return newState;
}

/**
 * Prepends a timestamped log entry to the state logs buffer.
 * @param {Object} state - Stadium state object.
 * @param {string} type - Log category.
 * @param {string} sender - Subsystem or sensor name.
 * @param {string} message - Human-readable log string.
 */
export function addLog(state, type, sender, message) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  state.logs.unshift({ time: timeStr, type, sender, message });
  if (state.logs.length > 80) state.logs.pop();
}

/**
 * Triggerable operational emergency and match scenarios.
 * @type {Object}
 */
export const SCENARIOS = {
  GATE_JAM: {
    id: "GATE_JAM",
    title: "Gate C Turnstile Jam",
    description: "Barcode reading errors at Gate C cause massive entry queues to form.",
    trigger: (state) => {
      const newState = JSON.parse(JSON.stringify(state));
      newState.gates.C.scannerStatus = "Error";
      newState.gates.C.queue = 190;
      newState.gates.C.flowRate = 3;
      
      if (!newState.incidents.find(i => i.id === 'incident-gate-c')) {
        newState.incidents.push({
          id: "incident-gate-c",
          title: "Gate C Entry Bottleneck",
          severity: "CRITICAL",
          description: "Barcode reader communication timeout on channels 4-7. 190+ fans queueing.",
          location: "Gate C (South)",
          timestamp: new Date().toTimeString().split(' ')[0],
        });
        addLog(newState, "ALERT", "Gate C Sensor", "CRITICAL ERROR: Barcode scanners degraded at Gate C. Flow rate reduced by 85%.");
      }
      return newState;
    }
  },
  CONCESSION_RUSH: {
    id: "CONCESSION_RUSH",
    title: "Taco Stand Stock Depletion",
    description: "Concourse tacos experience severe stock decline, creating high wait times.",
    trigger: (state) => {
      const newState = JSON.parse(JSON.stringify(state));
      const tacoIdx = newState.concessions.findIndex(c => c.id === 2);
      if (tacoIdx !== -1) {
        newState.concessions[tacoIdx].stockLevel = 8;
        newState.concessions[tacoIdx].waitTime = 45;
      }
      
      if (!newState.incidents.find(i => i.id === 'incident-taco-stock')) {
        newState.incidents.push({
          id: "incident-taco-stock",
          title: "Taco Stand Stock Crisis",
          severity: "WARNING",
          description: "Section 104 Taco Stand inventory depleted below 10%. Processing speed crippled.",
          location: "Concourse South (Sec 104)",
          timestamp: new Date().toTimeString().split(' ')[0],
        });
        addLog(newState, "ALERT", "Inventory Sys", "WARNING: Food supply alerts triggered. Section 104 stock below 10%.");
      }
      return newState;
    }
  },
  MEDICAL_ALERT: {
    id: "MEDICAL_ALERT",
    title: "Sec 108 Medical Incident",
    description: "Spectator experiencing heat exhaustion in Sector 108. Dispatch required.",
    trigger: (state) => {
      const newState = JSON.parse(JSON.stringify(state));
      
      if (!newState.incidents.find(i => i.id === 'incident-medical-108')) {
        newState.incidents.push({
          id: "incident-medical-108",
          title: "Medical Alert: Heat Exhaustion",
          severity: "CRITICAL",
          description: "Fan experiencing heat stroke symptoms in Sec 108 Row K. Medical responder dispatched.",
          location: "Sector 108 (East Tier)",
          timestamp: new Date().toTimeString().split(' ')[0],
        });
        addLog(newState, "ALERT", "Incident Desk", "MEDICAL ALARM: Heat stroke alert in Sector 108. Dispatch request sent.");
      }
      return newState;
    }
  },
  STORM_EVACUATION: {
    id: "STORM_EVACUATION",
    title: "Post-Match Weather Alert",
    description: "Sudden thunder/rain warning. Rapid crowd egress surge expected.",
    trigger: (state) => {
      const newState = JSON.parse(JSON.stringify(state));
      newState.matchInfo.weatherPhase = "Storm";
      newState.matchInfo.weather = "Severe Storm Warning";
      newState.transit.rideshareZone.status = "Suspended";
      newState.transit.rideshareZone.crowdLevel = "High";
      newState.transit.rideshareZone.waitTimeMin = 75;
      
      if (!newState.incidents.find(i => i.id === 'incident-storm')) {
        newState.incidents.push({
          id: "incident-storm",
          title: "Severe Weather Warning",
          severity: "CRITICAL",
          description: "Lightning strikes detected within 5km. Rideshare zone suspended. Subways adjusting to maximum capacity egress mode.",
          location: "Stadium Perimeter & Metro Zone",
          timestamp: new Date().toTimeString().split(' ')[0],
        });
        addLog(newState, "ALERT", "Weather Service", "CRITICAL: Severe lightning warning issued. Commencing egress priority protocols.");
      }
      return newState;
    }
  },
  POWER_OUTAGE: {
    id: "POWER_OUTAGE",
    title: "Sector 108 Power Grid Failure",
    description: "Simulates sudden loss of electrical telemetry in Section 108 quadrant.",
    trigger: (state) => {
      const newState = JSON.parse(JSON.stringify(state));
      
      if (!newState.incidents.find(i => i.id === 'incident-power')) {
        newState.incidents.push({
          id: "incident-power",
          title: "Section 108 Telemetry Outage",
          severity: "CRITICAL",
          description: "Substation power grid feedback loop interrupted. Core telemetry in Section 108 is offline.",
          location: "East Stand (Sec 108)",
          timestamp: new Date().toTimeString().split(' ')[0],
        });
        addLog(newState, "ALERT", "Infrastructure", "CRITICAL: Grid failures detected in eastern stands. Backup power generators starting.");
      }
      return newState;
    }
  }
};
