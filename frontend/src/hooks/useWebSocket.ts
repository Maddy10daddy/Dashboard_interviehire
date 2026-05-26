import { useState, useEffect, useRef, useCallback } from 'react';
import { WSStatus, WSMessage } from '../types/websocket';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WSMessage) => void;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectInterval = 1000,
  maxReconnectInterval = 10000,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WSStatus>('DISCONNECTED');
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();
  const pingTimer = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      setStatus('CONNECTING');
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setStatus('CONNECTED');
        reconnectAttempt.current = 0;
        
        // Start heartbeat
        pingTimer.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          
          if (data.type !== 'pong') {
            setMessages((prev) => [...prev, data]);
            if (onMessage) onMessage(data);
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      socket.onclose = () => {
        setStatus('DISCONNECTED');
        clearInterval(pingTimer.current);
        
        // Exponential backoff reconnect
        const delay = Math.min(
          reconnectInterval * Math.pow(2, reconnectAttempt.current),
          maxReconnectInterval
        );
        
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempt.current += 1;
          connect();
        }, delay);
      };

      socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        socket.close();
      };

      ws.current = socket;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [url, onMessage, reconnectInterval, maxReconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
    };
  }, [connect]);

  const sendMessage = useCallback((msg: Partial<WSMessage>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send message, WebSocket is not open');
    }
  }, []);

  return { status, messages, sendMessage };
}
