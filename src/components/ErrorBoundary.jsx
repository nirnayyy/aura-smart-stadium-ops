import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an active runtime exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#040508',
          color: '#f3f4f6',
          fontFamily: 'var(--font-heading), sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '22px', marginBottom: '10px', fontWeight: 800 }}>
            CRITICAL VEIL DETECTED: TELEMETRY DOWN
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', maxWidth: '500px', marginBottom: '20px', lineHeight: 1.5 }}>
            A critical exception crashed the active render thread. Operations consoles are attempting to re-establish connections.
          </p>
          <pre style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono), monospace',
            color: '#ef4444',
            maxWidth: '100%',
            overflowX: 'auto',
            textAlign: 'left'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 18px',
              background: '#10b981',
              border: 'none',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              marginTop: '15px',
              fontFamily: 'var(--font-mono), monospace'
            }}
          >
            RE-CALIBRATE AURA
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
