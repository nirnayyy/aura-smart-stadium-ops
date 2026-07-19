import { describe, it, expect } from 'vitest';
import { isGeminiConfigured, askGemini } from '../utils/geminiService';

describe('Gemini AI Service Configuration', () => {
  it('should evaluate configuration environment flag', () => {
    const configStatus = isGeminiConfigured();
    expect(typeof configStatus).toBe('boolean');
  });

  it('should fail with configuration errors when API key is missing', async () => {
    // If key is empty in test runner, assert that calling askGemini raises configuration error
    if (!isGeminiConfigured()) {
      const mockState = {
        incidents: [],
        gates: {},
        concessions: [],
        transit: {},
        matchInfo: {
          title: "Test Cup Final",
          phase: "Final",
          score: "1 - 1",
          possession: "50%",
          minute: 90,
          attendance: 80000,
          maxCapacity: 90000,
          weather: "Clear",
          weatherPhase: "Normal",
          sentiment: 95
        }
      };

      await expect(askGemini("Which gate is open?", mockState)).rejects.toThrow(
        "Gemini API Key is not configured"
      );
    }
  });
});
