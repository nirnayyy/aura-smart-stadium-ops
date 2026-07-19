import { describe, it, expect } from 'vitest';
import { generateAIOrchestration, AGENTS } from '../utils/aiOrchestrator';

describe('AURA AI Orchestrator', () => {
  it('should generate baseline operational recommendations under nominal conditions', () => {
    const mockState = {
      incidents: [],
      gates: { C: { scannerStatus: 'Online', queue: 10 } },
      concessions: []
    };
    const orchestration = generateAIOrchestration(mockState);
    expect(orchestration.recommendations.length).toBeGreaterThan(0);
    expect(orchestration.recommendations[0].details).toContain('nominal');
    expect(orchestration.fanAlerts.length).toBe(0);
    expect(orchestration.negotiationLogs.length).toBe(0);
  });

  it('should formulate cooperative responses and discounts during Gate Jam incidents', () => {
    const mockState = {
      incidents: [{ id: 'incident-gate-c', title: 'Gate C Jam', severity: 'CRITICAL' }],
      gates: {
        A: { scannerStatus: 'Online', queue: 5 },
        B: { scannerStatus: 'Online', queue: 10 },
        C: { scannerStatus: 'Error', queue: 190 },
        D: { scannerStatus: 'Online', queue: 8 },
        VIP: { scannerStatus: 'Online', queue: 2 }
      },
      concessions: [
        { id: 1, name: 'Burger', price: 10 },
        { id: 2, name: 'Taco', price: 12 },
        { id: 5, name: 'Hotdog', price: 8 }
      ]
    };
    const orchestration = generateAIOrchestration(mockState);
    
    // Recommendations check
    const crowdFlowRecs = orchestration.recommendations.filter(r => r.agent === AGENTS.CROWD_FLOW.badge);
    expect(crowdFlowRecs.length).toBeGreaterThan(0);
    
    // Pricing check: Section 218 (ID 5) concession discount to deflect demand
    expect(orchestration.pricingAdjustments[5]).toBe(0.7); // 30% discount
    
    // Ingress alerts check
    expect(orchestration.fanAlerts.length).toBe(1);
    expect(orchestration.fanAlerts[0].id).toBe('alert-gate-c');

    // Negotiation logs check
    expect(orchestration.negotiationLogs.length).toBe(1);
    expect(orchestration.negotiationLogs[0].dialogs.length).toBe(4);
  });

  it('should adjust concession pricing multipliers during inventory stockouts', () => {
    const mockState = {
      incidents: [{ id: 'incident-taco-stock', title: 'Taco Stock Out', severity: 'WARNING' }],
      gates: { C: { scannerStatus: 'Online', queue: 10 } },
      concessions: [{ id: 1 }, { id: 2 }]
    };
    const orchestration = generateAIOrchestration(mockState);
    
    // Taco stand pricing should surge (1.5x) and burger stand price should drop (0.75x) to steer demand
    expect(orchestration.pricingAdjustments[2]).toBe(1.5);
    expect(orchestration.pricingAdjustments[1]).toBe(0.75);
    expect(orchestration.fanAlerts[0].id).toBe('alert-taco');
  });

  it('should optimize routing and security alerts during medical emergencies', () => {
    const mockState = {
      incidents: [{ id: 'incident-medical-108', title: 'Medical Alert', severity: 'CRITICAL' }],
      gates: { C: { scannerStatus: 'Online', queue: 10 } },
      concessions: []
    };
    const orchestration = generateAIOrchestration(mockState);
    expect(orchestration.mapRouting.highlightedSections).toContain('Sec-108');
    expect(orchestration.fanAlerts[0].id).toBe('alert-medical');
  });

  it('should activate shelter incentives and suspend rideshare during severe storms', () => {
    const mockState = {
      incidents: [{ id: 'incident-storm', title: 'Storm Evac', severity: 'CRITICAL' }],
      gates: { C: { scannerStatus: 'Online', queue: 10 } },
      concessions: []
    };
    const orchestration = generateAIOrchestration(mockState);
    
    expect(orchestration.pricingAdjustments[3]).toBe(0.5); // Drinks discounted to retain fans
    expect(orchestration.pricingAdjustments[4]).toBe(0.5); // Desserts discounted
    expect(orchestration.mapRouting.highlightedSections).toContain('Lounges');
    expect(orchestration.fanAlerts[0].id).toBe('alert-storm');
  });
});
