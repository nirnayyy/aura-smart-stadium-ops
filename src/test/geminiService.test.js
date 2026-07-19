import { describe, it, expect, vi } from 'vitest';
import { isGeminiConfigured, askGemini, generateAgentNegotiation } from '../utils/geminiService';

vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: JSON.stringify([
      { agent: "IncidentCmd AI", text: "Mock dialogue text." },
      { agent: "CrowdFlow AI", text: "Mock response text." }
    ])
  });

  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent
  });

  class MockGoogleGenerativeAI {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
    getGenerativeModel = mockGetGenerativeModel;
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI
  };
});

describe('Gemini AI Service Queries', () => {
  it('should evaluate configuration environment flag', () => {
    const configStatus = isGeminiConfigured();
    expect(typeof configStatus).toBe('boolean');
  });

  it('should query askGemini success path', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'MOCK_KEY');
    
    const mockState = {
      incidents: [],
      gates: {},
      concessions: [],
      transit: {},
      matchInfo: { title: "Test", phase: "Final", score: "0-0", possession: "50%", minute: 10, attendance: 0, maxCapacity: 0, weather: "Clear", weatherPhase: "Nominal", sentiment: 90 }
    };

    const res = await askGemini("Hello", mockState);
    expect(res).toBeDefined();
    
    vi.unstubAllEnvs();
  });

  it('should query generateAgentNegotiation dialogue success path', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'MOCK_KEY');

    const mockState = {
      incidents: [{ title: "Incident A", severity: "HIGH", location: "Zone 1" }],
      gates: {},
      concessions: [],
      transit: {},
      matchInfo: { title: "Test", phase: "Final", score: "0-0", possession: "50%", minute: 10, attendance: 0, maxCapacity: 0, weather: "Clear", weatherPhase: "Nominal", sentiment: 90 }
    };

    const res = await generateAgentNegotiation(mockState);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].agent).toBe("IncidentCmd AI");
    
    vi.unstubAllEnvs();
  });

  it('should fail with configuration errors when API key is missing', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const mockState = { incidents: [], gates: {}, concessions: [], transit: {}, matchInfo: { title: "Test", phase: "Final", score: "0-0", possession: "50%", minute: 10, attendance: 0, maxCapacity: 0, weather: "Clear", weatherPhase: "Nominal", sentiment: 90 } };
    await expect(askGemini("Which gate is open?", mockState)).rejects.toThrow("Gemini API Key is not configured");
    vi.unstubAllEnvs();
  });
});
