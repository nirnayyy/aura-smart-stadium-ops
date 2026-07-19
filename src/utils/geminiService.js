/**
 * Google Gemini Generative AI Integration Service
 * @module geminiService
 * @description Interfaces with Google Gemini 1.5 Flash to provide real-time spectator chat and multi-agent negotiation dialogue.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Evaluates whether a valid Google Gemini API key is configured in the environment.
 * @returns {boolean} True if key is set.
 */
export function isGeminiConfigured() {
  const key = import.meta.env.VITE_GEMINI_API_KEY || '';
  return typeof key === 'string' && key.trim().length > 0;
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

/**
 * Queries Google Gemini 1.5 Flash model with full stadium telemetry context.
 * @param {string} message - Natural language fan question.
 * @param {Object} state - Active stadium state.
 * @returns {Promise<string>} AI assistant text answer.
 */
export async function askGemini(message, state) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API Key is not configured in environment.");
  }

  try {
    // Initialize the library using current key structure
    const key = import.meta.env.VITE_GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

/**
 * Generates dynamic multi-agent negotiation dialogue using Google Gemini 1.5 Flash.
 * @param {Object} state - Active stadium state.
 * @returns {Promise<Array<{agent: string, text: string}>>} Array of agent dialogue objects.
 */
export async function generateAgentNegotiation(state) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API Key is not configured in environment.");
  }

  const activeIncidents = state.incidents.map(i => 
    `- Incident: ${i.title} (${i.severity}) in ${i.location}.`
  ).join('\n') || "None. General operations running nominal.";

  const prompt = `You are the operations coordinator for AURA smart stadium.
There are 4 cooperative AI agents:
1. CrowdFlow AI (optimizes gate queues and routing)
2. IncidentCmd AI (coordinates responders, network updates)
3. FanExp AI (sends vouchers and maps)
4. ConcessOptimizer AI (manages concession stocks and prices)

=== CURRENT STADIUM CONTEXT ===
- Active Incidents:
${activeIncidents}
- Match Minute: ${state.matchInfo.minute}'
- Score: ${state.matchInfo.score}
- Weather: ${state.matchInfo.weather}
- Sentiment: ${state.matchInfo.sentiment}%
==============================

Generate a short, realistic coordination dialogue showing these agents discussing, collaborating, and negotiating a plan in real-time to handle the active situation.
Output your response ONLY as a valid JSON array of dialog objects. Do not wrap in markdown code blocks. Each dialog object must have exactly two fields:
- "agent": one of the 4 agent names (e.g., "CrowdFlow AI", "IncidentCmd AI", "FanExp AI", "ConcessOptimizer AI").
- "text": a short, professional dialogue contribution showing their collaboration or specific action.

Example Output:
[
  {"agent": "IncidentCmd AI", "text": "Stretcher team dispatched. ETA is 4 minutes."},
  {"agent": "CrowdFlow AI", "text": "Copy. Directing gate stewards to clear the concourse path."}
]`;

  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("Gemini returned invalid dialogue format.");
  } catch (error) {
    console.error("Gemini negotiation generation failed:", error);
    throw error;
  }
}
