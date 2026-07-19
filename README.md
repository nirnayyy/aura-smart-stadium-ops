# AURA 3.0: Cooperative Multi-Agent Smart Stadium Operations
### FIFA World Cup 2026 Smart Stadium Telemetry Grid & Fan Companion Console

AURA 3.0 is an interactive, high-fidelity operations console and fan companion simulator built for the FIFA World Cup 2026. It demonstrates how a cooperative team of specialized AI agents can collaborate in real time to resolve complex, concurrent stadium incidents—such as gate jams, medical emergencies, sudden storms, and concession stockouts—without overloading human operators.

---

## The Vision & The Problem

Managing a venue with 90,000 fans during a World Cup Final is a logistical puzzle. If a turnstile gate jams at the south entrance, it creates a massive crowd bottleneck. If a concession stand runs out of tacos, wait times spike. If a sudden thunderstorm hits, outdoor zones must be evacuated. 

Traditionally, these systems operate in silos: security doesn't talk to concessions, and concessions doesn't know about transportation delays. AURA 3.0 breaks down these silos. By simulating a network of cooperative AI agents that negotiate adjustments in real time (such as dynamic menu pricing, digital signage routing, and mobile vouchers), AURA maintains optimal operations and ensures fan safety and satisfaction.

---

## Inside the Core Engine

AURA's intelligence is driven by a cooperative multi-agent system located in `src/utils/aiOrchestrator.js`. These four specialized agents monitor stadium state, negotiate concessions, and direct logistics:

| Agent | Operational Mandate | Responsive Actions |
| :--- | :--- | :--- |
| **CrowdFlow AI** | Optimizes entrance/exit rates, balances gates, and manages transit queues. | Diverts pedestrian traffic, highlights alternative routes, and updates digital signage. |
| **IncidentCmd AI** | Coordinates responder dispatch, diagnoses hardware failures, and ensures safety. | Directs medical squads, deploys network support teams, and flags hazard zones. |
| **FanExp AI** | Elevates fan satisfaction, issues alerts, and distributes digital incentives. | Sends real-time wayfinding updates and issues hospitality/concession vouchers. |
| **ConcessOptimizer AI** | Tracks inventory thresholds, manages dynamic menus, and dispatches restocks. | Adjusts pricing multipliers to balance demand and triggers inventory supply runs. |

### Real-Time Agent Negotiation
When an incident is triggered, the agents initiate a negotiation dialogue in the console. For example, during a **Gate C Scanner Failure**:
* **IncidentCmd AI** flags the network timeouts and dispatches field support.
* **CrowdFlow AI** detects the queue build-up (150+ fans) and routes incoming traffic to East/West gates.
* **FanExp AI** pushes wayfinding reroutes to fans' phones within a 500m radius.
* **ConcessOptimizer AI** introduces a 30% discount at adjacent food stalls to pull fans out of the bottleneck queues.

---

## Interactive Features

### 1. Operations Telemetry Grid
An interactive, SVG-rendered stadium layout maps out seating sections, gates, and concession hubs in real time. It features a dynamic crowd density particle system where particle counts and color highlights respond directly to simulated incidents.

### 2. Mock CCTV Camera Hub
Operators can toggle between multiple live camera feeds (e.g., North Plaza, Section 108, Concourse East) complete with camera controls, telemetry overlays, and simulated terminal noise/scanlines for a premium command-center feel.

### 3. Scenario Control Panel
Simulate real-time match events and emergencies with the click of a button:
* **Ingress Jam:** Scanners fail, triggering gate queues to spike and agents to reroute incoming fans.
* **Medical Emergency:** Dispatches stretcher squads to Section 108, blinking stairwell alerts.
* **Sudden Storm:** Triggers rain/lightning, suspends rideshares, and guides fans to shelter.
* **Power Failure:** East stand shifts to backup generators, disabling non-essential concessions.
* **Egress Rush:** The final whistle blows, coordinating thousands of fans toward transit lines.

### 4. Smartphone Fan Companion App
Simulated side-by-side with the admin dashboard, the fan app showcases what spectators experience on their mobile devices:
* **Interactive AI Concierge:** Fans can ask about seating routes, gate queues, or concession wait times, receiving personalized, telemetry-aware responses.
* **Supply-Aware Pre-ordering:** Fans can customize food orders (e.g., adding toppings) with prices adjusting dynamically based on active inventory levels.
* **Live Route Guidance:** Blinks navigation paths to redirect fans away from congested areas.

---

## Design & Aesthetics

AURA is styled with pure custom CSS (located in `src/index.css` and `src/App.css`), prioritizing high-fidelity visual design and micro-interactions:
* **Dynamic Canvas Background:** An active particle-connection canvas shifts hues and speeds based on dark/light mode and active scenarios.
* **Glassmorphism Theme:** High-contrast panels, backdrop blurs, and neon borders offer a futuristic, sci-fi command-center look.
* **Scanline Sweeps:** Ambient CRT scanline overlays and flickering alerts emulate real-world diagnostic hardware.

---

## Tech Stack

* **Core Framework:** React 19 (built on Vite for rapid development and hot reloading)
* **Styling:** Custom CSS (incorporating CSS custom properties, grid layouts, keyframe animations)
* **Iconography:** Lucide React
* **Linting & Code Quality:** Oxlint (for high-speed static code analysis)

---

## Accessibility & Inclusion (WCAG Standards)

AURA 3.0 is built to support modern accessibility criteria:
* **Keyboard Navigation:** All interactive elements in the command grid (SVG sectors, gates, and concessions) are tab-focusable and can be selected using `Enter` or `Space` keys.
* **ARIA Semantic Tags:** Components utilize correct landmark roles (`tablist`, `tab`, `progressbar`, `alert`) and clear descriptive labels (`aria-label`, `aria-live="assertive"` for emergency warnings) to guide screen readers seamlessly.
* **Decorative SVGs:** Background grids, particle systems, and aesthetic lines are marked with `aria-hidden="true"` to prevent screen reader noise.

---

## Security & Sanitization

AURA 3.0 implements client-side and logical guards to prevent security compromises:
* **Input Sanitization:** User chat entries in the Fan App undergo HTML entity encoding to neutralize potential Cross-Site Scripting (XSS) script injections.
* **Pre-order Pricing Guards:** Calculations for concession discounts are validated on the client state, checking bounds to prevent price manipulation or order spoofing.
* **Bounds Verification:** Active state deep-copies and user string bounds are validated and protected via defensive checks.

---

## Automated Test Coverage

The project features a full unit and integration test suite using **Vitest** and **React Testing Library**:
* **Simulation Engine Tests:** Validates time clock ticks, goal score injections, restocking transitions, and scenario triggers.
* **AI Orchestrator Tests:** Asserts correct agent negotiation outputs, dynamic pricing shifts, and wayfinding alerts under nominal/incident states.
* **React Integration Tests:** Renders component layouts, simulates tab switching, validates input sanitization, and verifies progress bar accessibility roles.

Run tests using:
```bash
npm run test
```

---

## Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed on your machine.

### Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/aura-stadium-ops.git
cd aura-stadium-ops
npm install
```

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to the local address provided (typically `http://localhost:5173`).

### Production Build
To generate a compiled production bundle:
```bash
npm run build
```
This builds static assets into the `dist/` directory, optimized and ready to deploy.

---

## Automated Deployment with Vercel

This repository is optimized for Vercel. Because the project is built on Vite, Vercel will automatically detect the configuration and deploy it.

1. Push this project to your GitHub repository.
2. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import this repository.
4. Vercel will automatically configure the build command (`npm run build`) and output directory (`dist`).
5. Click **Deploy**. Any future commits pushed to the `main` branch will automatically trigger a new deployment.
