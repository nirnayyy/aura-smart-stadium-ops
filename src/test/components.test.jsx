import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import FanApp from '../components/FanApp';
import AdminDashboard from '../components/AdminDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { INITIAL_STADIUM_STATE } from '../utils/simulationEngine';
import { generateAIOrchestration } from '../utils/aiOrchestrator';

describe('AURA React Components Integration', () => {
  it('renders the core App layout and clock diagnostics', () => {
    render(<App />);
    expect(screen.getAllByText(/AURA/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/v3.2 ULTRA/i)).toBeInTheDocument();
  });

  it('renders FanApp and supports clicking tabs and pre-ordering', () => {
    const mockUpdateState = vi.fn();
    const mockAiData = generateAIOrchestration(INITIAL_STADIUM_STATE);
    
    render(
      <FanApp 
        state={INITIAL_STADIUM_STATE} 
        aiData={mockAiData} 
        updateState={mockUpdateState} 
      />
    );
    
    // Initial ticket tab should be active
    expect(screen.getByText(/FIFA WORLD CUP FINAL 2026/i)).toBeInTheDocument();
    expect(screen.getAllByText(/108/i).length).toBeGreaterThan(0); // Section 108

    // Click FOOD tab
    const foodTab = screen.getByRole('tab', { name: /FOOD/i });
    fireEvent.click(foodTab);

    // Verify concessions items list is visible
    expect(screen.getByText(/DIGITAL STALLS/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 104 Grill/i)).toBeInTheDocument();

    // Click pre-order on first item
    const preOrderBtn = screen.getAllByRole('button', { name: /Pre-order/i })[0];
    fireEvent.click(preOrderBtn);

    // Check customizer modal opens
    expect(screen.getByText(/CUSTOMIZE:/i)).toBeInTheDocument();
    
    // Toggle topping (e.g. Cheese)
    const cheeseToppingBtn = screen.getByRole('button', { name: /Toggle Cheese topping/i });
    fireEvent.click(cheeseToppingBtn);

    // Confirm Pre-Order
    const confirmOrderBtn = screen.getByRole('button', { name: /Confirm Pre-Order/i });
    fireEvent.click(confirmOrderBtn);

    // Verify order log event callback was triggered
    expect(mockUpdateState).toHaveBeenCalled();
  });

  it('sanitizes fan message inputs and handles companion response', () => {
    const mockUpdateState = vi.fn();
    const mockAiData = generateAIOrchestration(INITIAL_STADIUM_STATE);
    
    render(
      <FanApp 
        state={INITIAL_STADIUM_STATE} 
        aiData={mockAiData} 
        updateState={mockUpdateState} 
      />
    );

    // Switch to Chat tab
    const chatTab = screen.getByRole('tab', { name: /AI COMPANION/i });
    fireEvent.click(chatTab);

    // Check chat text input by label
    const chatInput = screen.getByLabelText(/Ask AURA Smart Stadium Companion/i);
    expect(chatInput).toBeInTheDocument();

    // Type a script injection payload to check security sanitization
    fireEvent.change(chatInput, { target: { value: '<script>console.log("xss")</script>' } });

    // Click Send button
    const sendBtn = screen.getByLabelText(/Send message to AI companion/i);
    fireEvent.click(sendBtn);

    // Expect the input text is sanitized (HTML characters escaped)
    expect(screen.getByText(/&lt;script&gt;console.log\(&quot;xss&quot;\)&lt;&#x2F;script&gt;/i)).toBeInTheDocument();
  });

  it('renders AdminDashboard gauges with correct progress roles', () => {
    const mockAiData = generateAIOrchestration(INITIAL_STADIUM_STATE);
    const mockTrigger = vi.fn();
    const mockReset = vi.fn();

    render(
      <AdminDashboard 
        state={INITIAL_STADIUM_STATE}
        aiData={mockAiData}
        triggerScenario={mockTrigger}
        resetSystem={mockReset}
        selectedElement={null}
        setSelectedElement={vi.fn()}
      />
    );

    // Verify system metrics are present and rendered with progressbar roles
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(3); // Attendance, Sentiment, Incidents
    
    // Check scenario trigger buttons function
    const gateJamBtn = screen.getByRole('button', { name: /Gate C Turnstile Jam/i });
    fireEvent.click(gateJamBtn);
    expect(mockTrigger).toHaveBeenCalledWith('GATE_JAM');
  });

  it('handles AdminDashboard camera panning, CCTV filters, and logs console tabs', () => {
    const mockAiData = generateAIOrchestration(INITIAL_STADIUM_STATE);
    const mockSetSelected = vi.fn();

    render(
      <AdminDashboard 
        state={INITIAL_STADIUM_STATE}
        aiData={mockAiData}
        triggerScenario={vi.fn()}
        resetSystem={vi.fn()}
        selectedElement={null}
        setSelectedElement={mockSetSelected}
      />
    );

    // Click CCTV filter mode button (e.g. thermal)
    const thermalBtn = screen.getByRole('button', { name: /thermal/i });
    fireEvent.click(thermalBtn);

    // Switch cameras (CAM-08)
    const cam8Btn = screen.getByRole('button', { name: /CAM-08 \(East Stand 108\)/i });
    fireEvent.click(cam8Btn);

    // Pan camera left
    const panLeftBtn = screen.getByRole('button', { name: /Pan camera left/i });
    fireEvent.click(panLeftBtn);

    // Switch tabs: AGENT DIALOGS
    const agentTab = screen.getByRole('button', { name: /AGENT DIALOGS/i });
    fireEvent.click(agentTab);

    // Switch back: LOG CONSOLE
    const logTab = screen.getByRole('button', { name: /LOG CONSOLE/i });
    fireEvent.click(logTab);

    // Change log filter source
    const filterSelect = screen.getByLabelText(/Filter Log Source/i);
    fireEvent.change(filterSelect, { target: { value: 'ALERT' } });
  });

  it('ErrorBoundary should catch render crashes and display system outage details', () => {
    const BadComponent = () => {
      throw new Error("Simulated telemetry crash");
    };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/CRITICAL VEIL DETECTED: TELEMETRY DOWN/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated telemetry crash/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
