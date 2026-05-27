'use client';

import React, { useState, useRef, useEffect } from 'react';
import { soundEngine } from '@/components/SoundEngine';
import { Play, Send } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  idleStatus: string;
  activeStatus: string;
  finalStatus: string;
  isActive: boolean;
}

interface TermLog {
  timestamp: string;
  sender: string;
  message: string;
  isUser?: boolean;
}

export default function SwarmPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'aria',
      name: 'Aria',
      role: 'Resume Analyst Agent',
      avatar: 'AR',
      status: 'Monitoring candidate submissions...',
      idleStatus: 'Monitoring candidate submissions...',
      activeStatus: 'Searching database indices...',
      finalStatus: 'Resume search queries completed.',
      isActive: false,
    },
    {
      id: 'kaelen',
      name: 'Kaelen',
      role: 'Technical Vetting Specialist',
      avatar: 'KL',
      status: 'Generating code challenge rubrics...',
      idleStatus: 'Generating code challenge rubrics...',
      activeStatus: 'Reviewing code repository requests...',
      finalStatus: 'Vetting analysis reports complete.',
      isActive: false,
    },
    {
      id: 'lyra',
      name: 'Lyra',
      role: 'HR Communications Bot',
      avatar: 'LY',
      status: 'Idle. Waiting for candidate triggers...',
      idleStatus: 'Idle. Waiting for candidate triggers...',
      activeStatus: 'Mailing screening reminders...',
      finalStatus: 'Communications queue synced successfully.',
      isActive: false,
    },
  ]);

  const [logs, setLogs] = useState<TermLog[]>([
    {
      timestamp: '10:42:01',
      sender: 'Aria',
      message: 'System diagnostics initiated. Swarm link online.',
    },
    {
      timestamp: '10:42:15',
      sender: 'Lyra',
      message: 'Syncing candidate databases with email queue...',
    },
    {
      timestamp: '10:43:02',
      sender: 'Kaelen',
      message: 'Dispatched coding test to Candidate CAN-8234-EA1.',
    },
  ]);

  const [promptInput, setPromptInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;

    soundEngine.playClick();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userPrompt = promptInput;
    setPromptInput('');

    // Append user log
    setLogs((prev) => [
      ...prev,
      {
        timestamp: nowStr,
        sender: 'User',
        message: userPrompt,
        isUser: true,
      },
    ]);

    const textLower = userPrompt.toLowerCase();
    let targetAgentId = 'aria';
    let responseText = '';

    if (
      textLower.includes('kaelen') ||
      textLower.includes('code') ||
      textLower.includes('review') ||
      textLower.includes('rubric')
    ) {
      targetAgentId = 'kaelen';
      responseText =
        'Completed source-level review audit. Identified 1 candidate matching standard repository test coverages.';
    } else if (
      textLower.includes('lyra') ||
      textLower.includes('email') ||
      textLower.includes('invite') ||
      textLower.includes('send')
    ) {
      targetAgentId = 'lyra';
      responseText =
        'Scanned queue. Dispatched invitation link templates to pending candidates list.';
    } else {
      targetAgentId = 'aria';
      responseText =
        'Filtered database matches. Identified candidates within desired experience and role configurations.';
    }

    // Set target agent state to active
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === targetAgentId) {
          return {
            ...agent,
            status: agent.activeStatus,
            isActive: true,
          };
        }
        return agent;
      })
    );

    // Timeout for AI response
    setTimeout(() => {
      const respTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const targetAgent = agents.find((a) => a.id === targetAgentId);
      const name = targetAgent ? targetAgent.name : 'System';

      setLogs((prev) => [
        ...prev,
        {
          timestamp: respTimeStr,
          sender: name,
          message: responseText,
        },
      ]);

      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === targetAgentId) {
            return {
              ...agent,
              status: agent.finalStatus,
              isActive: false,
            };
          }
          return agent;
        })
      );

      soundEngine.playChime([392.0, 523.25, 659.25], 0.15, 0.1);
    }, 1500);
  };

  return (
    <section className="dashboard-view active-view" id="view-swarm">
      <div className="swarm-layout">
        {/* Agents Cards Grid */}
        <div className="agents-status-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="card-glass agent-card" id={`agent-${agent.id}`}>
              <div className="agent-avatar-status">
                <div className="agent-pic">{agent.avatar}</div>
                <span className={`pulse-dot ${agent.isActive ? 'orange' : 'green'}`}></span>
              </div>
              <div className="agent-meta">
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-role-lbl">{agent.role}</p>
                <p className="agent-status-msg" id={`${agent.id}-status`}>
                  {agent.status}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Terminal console logs */}
        <div className="card-glass terminal-box">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="terminal-title">A.I. Swarm Ticker Activity Feed</span>
          </div>

          <div className="terminal-body" id="swarm-terminal-body">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`term-log ${log.isUser ? 'font-gold' : ''}`}
                style={log.isUser ? { color: 'var(--color-gold)' } : undefined}
              >
                <code>[{log.timestamp}] {log.sender}:</code> {log.message}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <form onSubmit={handleSendPrompt} className="terminal-input-wrap">
            <span className="terminal-prompt">&gt;</span>
            <input
              type="text"
              id="swarm-prompter"
              placeholder="Ask the AI Swarm to do something... (e.g. 'Aria, search for Go devs')"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />
            <button type="submit" id="btn-swarm-prompt" className="btn-term-send">
              <Send size={14} style={{ marginRight: '6px' }} />
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
