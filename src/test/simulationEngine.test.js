import { describe, it, expect } from 'vitest';
import { 
  INITIAL_STADIUM_STATE, 
  tickSimulation, 
  addLog, 
  SCENARIOS 
} from '../utils/simulationEngine';

describe('AURA Simulation Engine', () => {
  it('should initialize with standard stadium telemetry data', () => {
    expect(INITIAL_STADIUM_STATE).toBeDefined();
    expect(INITIAL_STADIUM_STATE.matchInfo.minute).toBe(74);
    expect(INITIAL_STADIUM_STATE.gates.C.scannerStatus).toBe('Online');
    expect(INITIAL_STADIUM_STATE.restockStatus).toBe('Idle');
    expect(INITIAL_STADIUM_STATE.logs.length).toBeGreaterThan(0);
  });

  it('should tick time correctly and increment game clock', () => {
    let state = { ...INITIAL_STADIUM_STATE };
    state.matchInfo = { ...state.matchInfo, minute: 75, second: 0 };
    
    const nextState = tickSimulation(state);
    expect(nextState.matchInfo.second).toBe(30);
    expect(nextState.matchInfo.minute).toBe(75);
  });

  it('should trigger goal score adjustments at specific timestamps', () => {
    let state = { ...INITIAL_STADIUM_STATE };
    
    // Test Mbappé's goal at 82:00
    state.matchInfo = { ...state.matchInfo, minute: 81, second: 30, score: "2 - 1" };
    state = tickSimulation(state); // will advance to 82:00
    expect(state.matchInfo.score).toBe("2 - 2");
    
    // Test Messi's goal at 89:00
    state.matchInfo = { ...state.matchInfo, minute: 88, second: 30, score: "2 - 2" };
    state = tickSimulation(state); // will advance to 89:00
    expect(state.matchInfo.score).toBe("3 - 2");
  });

  it('should support logging operations and bound overall list capacity', () => {
    const state = JSON.parse(JSON.stringify(INITIAL_STADIUM_STATE));
    state.logs = Array.from({ length: 80 }, (_, i) => ({ time: "12:00:00", type: "SYSTEM", sender: "Test", message: `Msg ${i}` }));
    
    addLog(state, "SYSTEM", "TestSender", "New diagnostic message");
    expect(state.logs.length).toBe(80);
    expect(state.logs[0].message).toBe("New diagnostic message");
  });

  it('should run inventory restock cycles to completion', () => {
    let state = JSON.parse(JSON.stringify(INITIAL_STADIUM_STATE));
    state.concessions[0].stockLevel = 10;
    state.concessions[1].stockLevel = 20;
    state.restockStatus = "Dispatching";

    // First tick transitions from Dispatching to In Progress
    state = tickSimulation(state);
    expect(state.restockStatus).toBe("In Progress");

    // Second tick executes the restocking replenishment
    state = tickSimulation(state);
    expect(state.concessions[0].stockLevel).toBeGreaterThan(10);
    expect(state.concessions[1].stockLevel).toBeGreaterThan(20);
  });

  it('should execute scenario triggers correctly', () => {
    let state = JSON.parse(JSON.stringify(INITIAL_STADIUM_STATE));
    expect(state.gates.C.scannerStatus).toBe('Online');
    
    state = SCENARIOS.GATE_JAM.trigger(state);
    expect(state.gates.C.scannerStatus).toBe('Error');
    expect(state.gates.C.queue).toBe(190);
    expect(state.incidents.find(i => i.id === 'incident-gate-c')).toBeDefined();

    state = SCENARIOS.POWER_OUTAGE.trigger(state);
    expect(state.incidents.find(i => i.id === 'incident-power')).toBeDefined();
  });
});
