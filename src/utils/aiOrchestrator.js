// AURA Multi-Agent Operations & Experience AI Orchestrator - Upgraded Version
// Simulates state-aware operational intelligence and multi-agent negotiations.

export const AGENTS = {
  CROWD_FLOW: {
    name: "CrowdFlow AI",
    badge: "Agent [CrowdFlow]",
    colorClass: "cyan",
    role: "Optimizes venue flow, gate queue balancing, and transit egress patterns."
  },
  INCIDENT_CMD: {
    name: "IncidentCmd AI",
    badge: "Agent [IncidentCmd]",
    colorClass: "red",
    role: "Coordinates first responder dispatch, hardware failure diagnostics, and safety perimeters."
  },
  FAN_EXP: {
    name: "FanExp AI",
    badge: "Agent [FanExp]",
    colorClass: "magenta",
    role: "Tailors fan alerts, manages wayfinding overlays, and issues customer hospitality vouchers."
  },
  CONCESS_OPTIMIZER: {
    name: "ConcessOptimizer AI",
    badge: "Agent [ConcessOpt]",
    colorClass: "yellow",
    role: "Monitors inventory stockout thresholds, coordinates restock dispatches, and adjusts dynamic menus."
  }
};

export function generateAIOrchestration(state) {
  const recommendations = [];
  const fanAlerts = [];
  const signageDirectives = [];
  const mapRouting = {
    highlightedSections: [],
    closedGates: [],
    suggestedRoutes: []
  };
  const pricingAdjustments = {};
  const negotiationLogs = []; // Stores dialog scripts of agent reasoning

  const pushRec = (agent, action, details, priority = "INFO") => {
    recommendations.push({ agent: agent.badge, colorClass: agent.colorClass, action, details, priority });
  };

  // Default baseline checks
  pushRec(
    AGENTS.CROWD_FLOW,
    "Perimeter Scan",
    "All entrance portals A-D reporting active ticketing streams. Crowd density distribution: nominal.",
    "INFO"
  );
  pushRec(
    AGENTS.CONCESS_OPTIMIZER,
    "Menu Supply Audit",
    "Auditing main level concessions. Section 104 Grill and Sec 218 reporting steady sales. Inventory levels checked.",
    "INFO"
  );

  // Check incidents and formulate multi-agent negotiations
  const gateIncident = state.incidents.find(i => i.id === "incident-gate-c");
  const tacoIncident = state.incidents.find(i => i.id === "incident-taco-stock");
  const medicalIncident = state.incidents.find(i => i.id === "incident-medical-108");
  const stormIncident = state.incidents.find(i => i.id === "incident-storm");
  const powerIncident = state.incidents.find(i => i.id === "incident-power");

  // Incident 1: GATE_JAM (Gate C scanner failure)
  if (gateIncident) {
    pricingAdjustments[2] = 0.8; // 20% discount near C
    pricingAdjustments[5] = 0.7; // 30% discount at Sec 218 to pull fans away
    
    mapRouting.closedGates.push("C");
    mapRouting.highlightedSections.push("Sec-South");
    mapRouting.suggestedRoutes.push("GateC-to-GateD", "GateC-to-GateB");

    pushRec(
      AGENTS.CROWD_FLOW,
      "Reroute Entry Streams",
      "Gate C entry rate drops to 4 fans/min. Diverting incoming South plaza traffic to Gate D (West) and Gate B (East).",
      "CRITICAL"
    );

    pushRec(
      AGENTS.INCIDENT_CMD,
      "Technical Dispatch",
      "Identified TCP socket dropouts on Gate C controllers. Dispatching Network Support Team Delta. ETA 4 mins.",
      "CRITICAL"
    );

    pushRec(
      AGENTS.FAN_EXP,
      "Wayfinding Broadcast",
      "Triggering live blue glow route paths on mobile ticket screens for all fans entering South perimeter plazas.",
      "HIGH"
    );

    pushRec(
      AGENTS.CONCESS_OPTIMIZER,
      "Ingress Demand Deflection",
      "Deploying 30% discount vouchers to Sec 218 Express Bites to retain fans and absorb queue backlog.",
      "MEDIUM"
    );

    negotiationLogs.push({
      id: "negotiation-gate-c",
      incident: "Gate C Turnstile Jam",
      dialogs: [
        { agent: "IncidentCmd AI", text: "Gate C hardware reports socket timeouts. Scanners offline. We need diagnostic access corridors cleared immediately." },
        { agent: "CrowdFlow AI", text: "Acknowledged. Incoming queue stands at 190+ and growing. I'm modifying perimeter plaza signage to route fans East/West." },
        { agent: "FanExp AI", text: "Understood. Pushing wayfinding reroute overrides to all mobile apps within 500m of South Gate." },
        { agent: "ConcessOptimizer AI", text: "To assist, I have applied a 30% discount at Section 218 concessions. This will entice waiting fans to exit queues and grab refreshments." }
      ]
    });

    fanAlerts.push({
      id: "alert-gate-c",
      title: "Ingress Bottleneck: Gate C Delay",
      message: "Scanners at Gate C are running below capacity. Tap to load wayfinding map and follow the blue path to Gate B or Gate D.",
      icon: "navigation"
    });

    signageDirectives.push("South Plaza Board: GATE C OFFLINE. PROCEED TO GATE D (50m WEST) OR GATE B (80m EAST).");
  }

  // Incident 2: CONCESSION_RUSH (Taco Stock depletion)
  if (tacoIncident) {
    pricingAdjustments[2] = 1.5; // slow down tacos
    pricingAdjustments[1] = 0.75; // discount grill burger to deflect demand

    pushRec(
      AGENTS.CONCESS_OPTIMIZER,
      "Dynamic Pricing Intervention",
      "Copa Cabana Tacos inventory is below 10%. Increasing price multiplier by +50% to curb demand; applying 25% discount to nearest burger stand.",
      "HIGH"
    );

    pushRec(
      AGENTS.FAN_EXP,
      "Menu Target Redirection",
      "Pushing push notifications to fans near Section 104 advising of burger deals and minimal waiting.",
      "MEDIUM"
    );

    negotiationLogs.push({
      id: "negotiation-taco-stock",
      incident: "Taco Stand Stock Depletion",
      dialogs: [
        { agent: "ConcessOptimizer AI", text: "Section 104 Tacos supply level is at 8%. Wait times are projected to reach 45 mins. I must throttle ordering rates." },
        { agent: "FanExp AI", text: "I can deflect demand. Pushing a 25% discount coupon for Section 104 Grill to all fans in adjacent seating sections." },
        { agent: "ConcessOptimizer AI", text: "Excellent. I've raised the taco pricing multiplier to 1.5 and lowered the Grill multiplier to 0.75. Updating menus." }
      ]
    });

    fanAlerts.push({
      id: "alert-taco",
      title: "Copa Cabana Tacos Stock Alert",
      message: "Tacos are almost sold out. Skip the line at Section 104 Grill and get 25% off the Stadium Burger instead!",
      icon: "shopping-bag"
    });

    signageDirectives.push("Concourse Display: SECTION 104 GRILL SPECIAL — 25% OFF ALL BURGERS.");
  }

  // Incident 3: MEDICAL_ALERT (Heat stroke Sec 108)
  if (medicalIncident) {
    mapRouting.highlightedSections.push("Sec-108");

    pushRec(
      AGENTS.INCIDENT_CMD,
      "Emergency Stretcher Dispatch",
      "Medical Team Echo dispatched to Section 108 Row K. Medical access route activated on main telemetry grid.",
      "CRITICAL"
    );

    pushRec(
      AGENTS.CROWD_FLOW,
      "Access Lane Stabilization",
      "Directing nearby security stewards to establish a clear responder line from gate B to East stand stairwells.",
      "HIGH"
    );

    negotiationLogs.push({
      id: "negotiation-medical-108",
      incident: "Section 108 Medical Alert",
      dialogs: [
        { agent: "IncidentCmd AI", text: "Critical heat stroke flagged in Section 108 Row K. Stretcher squad Echo is moving from medical bay 2." },
        { agent: "CrowdFlow AI", text: "Medical squad route runs through Concourse East. I'm blinking indicators on security staff terminals to clear the stairs." },
        { agent: "FanExp AI", text: "Pushing in-app warnings to fans in Section 108 and adjacent aisles to yield passage for response staff." }
      ]
    });

    fanAlerts.push({
      id: "alert-medical",
      title: "Medical Team Access Notice",
      message: "First responders are moving through East Concourse aisles. Please keep stairs and corridors clear. Thank you.",
      icon: "shield"
    });

    signageDirectives.push("East Concourse Monitor: PLEASE KEEP Aisle 108 CLEAR FOR EMERGENCY SQUADS.");
  }

  // Incident 4: STORM_EVACUATION (Severe storm warning)
  if (stormIncident) {
    pricingAdjustments[3] = 0.5; // half price drinks
    pricingAdjustments[4] = 0.5; // half price ice cream

    mapRouting.highlightedSections.push("Lounges", "TransitHub");

    pushRec(
      AGENTS.CROWD_FLOW,
      "Evacuation Egress Protocols",
      "Rideshare hub suspended due to lightning strikes. Commencing 100% egress redirection towards covered Metro Transit Hub platform.",
      "CRITICAL"
    );

    pushRec(
      AGENTS.FAN_EXP,
      "Shelter Retainment Incentive",
      "Distributing free dynamic vouchers for indoor coffee stands and lounges to prevent stampede at outdoor gates.",
      "CRITICAL"
    );

    pushRec(
      AGENTS.CONCESS_OPTIMIZER,
      "Lounge Logistics Shift",
      "Activating 50% discount on hot drinks. Moving concession staff from open concession stands to central atrium terminals.",
      "HIGH"
    );

    negotiationLogs.push({
      id: "negotiation-storm",
      incident: "Severe Weather Egress Override",
      dialogs: [
        { agent: "CrowdFlow AI", text: "Lightning strikes detected within 5km. External plazas are unsafe. Rideshare hub is shut down." },
        { agent: "IncidentCmd AI", text: "Evacuation to open perimeters must be delayed. We should hold fans inside the covered stadium concourses." },
        { agent: "FanExp AI", text: "Understood. I will push retention vouchers for indoor lounges and cafes to keep fans sheltered." },
        { agent: "ConcessOptimizer AI", text: "Agreed. Deploying 50% dynamic discounts on beverages. All atrium stands are ready for load increases." }
      ]
    });

    fanAlerts.push({
      id: "alert-storm",
      title: "Weather Alert: Stay Sheltered",
      message: "Lightning warnings are active. Ridesharing is temporarily closed. Stay dry inside covered concourses with half-price hot drinks.",
      icon: "cloud-lightning"
    });

    signageDirectives.push("Emergency Broadcast: WEATHER STORM ACTIVE. REMAIN IN COVERED CONCOURSES. SUBWAYS FULLY OPERATIONAL.");
  }

  // Incident 5: POWER_OUTAGE (Telemetry outage)
  if (powerIncident) {
    mapRouting.highlightedSections.push("Sec-108");

    pushRec(
      AGENTS.INCIDENT_CMD,
      "Telemetry Grid Restoration",
      "Sector 108 power lines reported tripped. Activating grid recovery relays and starting auxiliary generators. Telemetry telemetry is estimated offline for 5 mins.",
      "CRITICAL"
    );

    pushRec(
      AGENTS.CROWD_FLOW,
      "Physical Steward Auditing",
      "Telemetry sensors offline. Requesting local staff to report crowd sizes in East Stand via manual radio channels.",
      "HIGH"
    );

    negotiationLogs.push({
      id: "negotiation-power",
      incident: "Quadrant Power Interruption",
      dialogs: [
        { agent: "IncidentCmd AI", text: "Auxiliary power grid failure detected in Section 108. All sensor feeds are greyed out." },
        { agent: "CrowdFlow AI", text: "Lost crowd counting telemetry in the East stand. Deploying stewards to manually observe flow rates." },
        { agent: "FanExp AI", text: "Broadcasting backup directions. Mobile apps will operate on local cached templates to save battery." }
      ]
    });

    fanAlerts.push({
      id: "alert-power",
      title: "Network Latency: East Quadrant",
      message: "Telemetry sensors are performing backup updates in Section 108. Services remain online, staff are standing by to guide you.",
      icon: "wifi"
    });

    signageDirectives.push("East Concourse Monitor: BACKUP GRID SYSTEM ACTIVE. SCANNER SYSTEMS RUNNING ON LOCAL POWER.");
  }

  return {
    recommendations,
    fanAlerts,
    signageDirectives,
    mapRouting,
    pricingAdjustments,
    negotiationLogs
  };
}
