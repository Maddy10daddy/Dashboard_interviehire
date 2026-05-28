'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { soundEngine } from '@/components/SoundEngine';
import {
  Briefcase,
  BarChart3,
  Monitor,
  Users,
  Globe,
  Settings,
  PlusCircle,
  Mail,
  Lock,
  Cookie,
  Search,
} from 'lucide-react';

interface CommandItem {
  name: string;
  desc: string;
  icon: any;
  action: (router: ReturnType<typeof useRouter>, openDrawer: ReturnType<typeof useAppContext>['openDrawer']) => void;
  shortcut: string;
  keys: string; // Key combination representation for matching
}

const SPOTLIGHT_COMMANDS: CommandItem[] = [
  {
    name: 'Switch to Jobs View',
    desc: 'Navigate to jobs listings and pipeline',
    icon: Briefcase,
    action: (router) => router.push('/jobs'),
    shortcut: 'Alt+1',
    keys: 'Alt+1',
  },
  {
    name: 'View Usage Overview',
    desc: 'Track funnel metrics and analytics tables',
    icon: BarChart3,
    action: (router) => router.push('/analytics'),
    shortcut: 'Alt+2',
    keys: 'Alt+2',
  },

  {
    name: 'View Team Access Logs',
    desc: 'Manage team invites, roles, and security',
    icon: Users,
    action: (router) => router.push('/team'),
    shortcut: 'Alt+4',
    keys: 'Alt+4',
  },
  {
    name: 'Configure Career Subdomain',
    desc: 'Update public career subdomain configurations',
    icon: Globe,
    action: (router) => router.push('/career'),
    shortcut: 'Alt+5',
    keys: 'Alt+5',
  },
  {
    name: 'Open Job Creator Drawer',
    desc: 'Create a new recruitment pipeline job card',
    icon: PlusCircle,
    action: (_, openDrawer) => openDrawer('job'),
    shortcut: 'Alt+N',
    keys: 'Alt+n',
  },
  {
    name: 'Open Invitation Drawer',
    desc: 'Invite a new team member or manager',
    icon: Mail,
    action: (_, openDrawer) => openDrawer('member'),
    shortcut: 'Alt+I',
    keys: 'Alt+i',
  },
  {
    name: 'Change Security Settings',
    desc: 'Change password credential settings',
    icon: Lock,
    action: (router) => router.push('/settings/password'),
    shortcut: 'Alt+P',
    keys: 'Alt+p',
  },
  {
    name: 'Cookie Settings',
    desc: 'Manage session privacy cookie settings',
    icon: Cookie,
    action: (router) => router.push('/settings/cookies'),
    shortcut: 'Alt+C',
    keys: 'Alt+c',
  },
];

export default function SpotlightModal() {
  const router = useRouter();
  const { spotlightOpen, setSpotlightOpen, openDrawer, closeDrawer } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (spotlightOpen) {
      soundEngine.playClick();
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [spotlightOpen]);

  // Global event listener for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen(!spotlightOpen);
      }

      // ESC
      if (e.key === 'Escape') {
        if (spotlightOpen) {
          e.preventDefault();
          setSpotlightOpen(false);
        } else {
          closeDrawer();
        }
      }

      // Check Alt shortcuts
      if (e.altKey) {
        const matchingCmd = SPOTLIGHT_COMMANDS.find(
          (cmd) => cmd.keys.toLowerCase() === `alt+${e.key.toLowerCase()}`
        );
        if (matchingCmd) {
          e.preventDefault();
          soundEngine.playClick();
          matchingCmd.action(router, openDrawer);
          setSpotlightOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spotlightOpen, setSpotlightOpen, router, openDrawer, closeDrawer]);

  const filteredCommands = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return SPOTLIGHT_COMMANDS;
    return SPOTLIGHT_COMMANDS.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.desc.toLowerCase().includes(query)
    );
  }, [search]);

  // Navigate items with arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        const cmd = filteredCommands[selectedIndex];
        soundEngine.playClick();
        cmd.action(router, openDrawer);
        setSpotlightOpen(false);
      }
    }
  };

  if (!spotlightOpen) return null;

  return (
    <div
      className="spotlight-overlay active"
      id="spotlight-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSpotlightOpen(false);
        }
      }}
    >
      <div className="spotlight-box card-glass">
        <div className="spotlight-header">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            id="spotlight-input"
            placeholder="Type a command or search... (esc to close)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="spotlight-results" id="spotlight-results-list">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No command shortcuts match your query
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.name}
                  className={`spotlight-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    soundEngine.playClick();
                    cmd.action(router, openDrawer);
                    setSpotlightOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="item-left">
                    <Icon size={14} className="cmd-icon-svg" />
                    <span className="cmd-name">{cmd.name}</span>
                    <span className="cmd-desc">{cmd.desc}</span>
                  </div>
                  <span className="cmd-shortcut">
                    <kbd>{cmd.shortcut}</kbd>
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div className="spotlight-footer">
          <span>Use ↑↓ to navigate, <kbd>Enter</kbd> to execute, <kbd>Esc</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
}
