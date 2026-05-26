import React from 'react';
import { WSStatus } from '../types/websocket';

interface StatusIndicatorProps {
  status: WSStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  let color = 'hsl(var(--status-amber))'; // CONNECTING
  let text = 'Connecting...';

  if (status === 'CONNECTED') {
    color = 'hsl(var(--status-emerald))';
    text = 'System Operational';
  } else if (status === 'DISCONNECTED') {
    color = 'hsl(0, 80%, 60%)'; // Red
    text = 'Disconnected';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: status === 'CONNECTED' ? `0 0 10px ${color}` : 'none',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
        }}
      />
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--text-main))' }}>
        {text}
      </span>
    </div>
  );
}
