import { GoogleGenAI } from '@google/generative-ai';

// Retrieve the API Key from Vite env variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Returns true if a key is configured
export function isGeminiConfigured() {
  return typeof API_KEY === 'string' && API_KEY.trim().length > 0;
}

// Builds the dynamic prompt structure feeding active stadium telemetry
function compileSystemPrompt(state) {
  const activeIncidents = state.incidents.map(i => 
    `- Incident: ${i.title} (${i.severity}) - Details: ${i.description} in ${i.location}`
  ).join('\n');

  const gatesList = Object.entries(state.gates).map(([key, gate]) =>
    `- Gate ${key} (${gate.name}): Queue size: ${gate.queue} fans, Scanner status: ${gate.scannerStatus}, flow rate: ${gate.flowRate} fans/min`
  ).join('\n');

  const concessionsList = state.concessions.map(c =>
    `- Stall: ${c.name} (ID: ${c.id}), wait time: ${c.waitTime} min, stock level: ${c.stockLevel}%, popular item: ${c.popularItem}, price: $${c.price.toFixed(2)}`
  ).join('\n');

  const transitList = Object.entries(state.transit).map(([key, t]) =>
    `- Transit line: ${t.name} (Key: ${key}), status: ${t.status || 'Normal'}, next arrival: ${t.nextArrivalMin} mins, load: ${t.crowdLevel}`
  ).join('\n');

  return `You are AURA, the intelligent smart stadium operations and fan companion AI for the FIFA World Cup 2026.
Your personality is professional, prompt, helpful, and technologically advanced.
You are running on a spectator's mobile companion app. Your answers must be short (maximum 3-4 sentences), highly specific, and make active use of the live stadium metrics provided below.

=== LIVE STADIUM TELEMETRY ===
- Current Match: ${state.matchInfo.title} (${state.matchInfo.phase})
- Score: ${state.matchInfo.score} (Possession: ${state.matchInfo.possession}, Minute: ${state.matchInfo.minute}')
- Attendance: ${state.matchInfo.attendance.toLocaleString()} / ${state.matchInfo.maxCapacity.toLocaleString()} (${Math.round(state.matchInfo.attendance / state.matchInfo.maxCapacity * 100)}% capacity)
- Weather Status: ${state.matchInfo.weather} (Phase: ${state.matchInfo.weatherPhase})
- Global Fan Sentiment Index: ${state.matchInfo.sentiment}%

ACTIVE ALERTS AND EMERGENCY INCIDENTS:
${activeIncidents || 'None. Stadium operations are running nominal.'}

GATE QUEUES & TELEMETRY:
${gatesList}

CONCESSIONS MENU AND STANDS:
${concessionsList}

METRO & RIDESHARE TRANSIT STATUS:
${transitList}
==============================

GUIDELINES FOR INSTRUCTIONS:
1. If a fan asks about seating or sections, direct them section-by-section using Metlife level 100 paths (Section 108 corridor is accessed via Gate B Escalator 4).
2. If gates are congested (e.g. Gate C scanners offline), reroute them to Gate B (East) or Gate D (West).
3. If food items are low in stock, recommend adjacent alternatives (e.g., recommend Section 104 Grill burgers if tacos are stockout) or promote vouchers.
4. Keep the style modern, clear, and action-oriented. Provide ETA values.`;
}

// Interacts with Google Gemini generative API model
export async function askGemini(message, state) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API Key is not configured in environment.");
  }

  try {
    // Initialize the library using current key structure
    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = compileSystemPrompt(state);
    
    // Compile chat content request
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 300,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}
