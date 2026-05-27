'use client';

import { usePathname } from 'next/navigation';
import { Search, Moon, Sun } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';

// Route → header config mapping
const HEADER_CONFIG: Record<string, {
  breadcrumb: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionType?: 'job' | 'member';
}> = {
  '/jobs': {
    breadcrumb: 'Jobs',
    title: 'Good morning, Devasri 🌤️',
    subtitle: 'A squad of AI agents working for you',
    actionLabel: 'New Job',
    actionType: 'job',
  },
  '/analytics': {
    breadcrumb: 'Usage Overview',
    title: 'Usage Overview',
    subtitle: 'Track applicants funnel metrics and pipelines',
    actionLabel: 'New Job',
    actionType: 'job',
  },
  '/swarm': {
    breadcrumb: 'AI Swarm',
    title: 'AI Swarm Console',
    subtitle: 'A squad of autonomous AI agents working for you',
  },
  '/team': {
    breadcrumb: 'Team Access',
    title: 'Team Access Settings',
    subtitle: 'Manage organisation access, usertypes, and invite collaborators',
    actionLabel: 'Invite Member',
    actionType: 'member',
  },
  '/career': {
    breadcrumb: 'Career Page',
    title: 'Career Subdomain Control',
    subtitle: 'Design corporate listings page appearance and themes',
  },
  '/settings/password': {
    breadcrumb: 'Settings / Security',
    title: 'Admin Password Panel',
    subtitle: 'Change access credentials for Org. Admin',
  },
  '/settings/cookies': {
    breadcrumb: 'Settings / Cookies',
    title: 'Cookie Policies',
    subtitle: 'Manage cookie levels and session trackers',
  },
};

export default function DashboardHeader() {
  const pathname = usePathname();
  const { globalSearch, setGlobalSearch, openDrawer } = useAppContext();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('interviehire-theme');
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    if (saved === 'light' || (!saved && prefersLight)) {
      document.body.classList.add('light-theme');
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light-theme', next);
    localStorage.setItem('interviehire-theme', next ? 'light' : 'dark');
  };

  // Find matching config (handle dynamic routes like /jobs/[id])
  let config = HEADER_CONFIG[pathname];
  if (!config) {
    // Check if it's a job detail page
    if (pathname.startsWith('/jobs/')) {
      config = {
        breadcrumb: 'Jobs',
        title: 'Job Detail',
        subtitle: 'View candidate responses and funnel metrics',
      };
    } else {
      config = {
        breadcrumb: 'Dashboard',
        title: 'Dashboard',
        subtitle: '',
      };
    }
  }

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span className="breadcrumb-item">Client Portal</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active" id="breadcrumb-title">
            {config.breadcrumb}
          </span>
        </div>
        <h1 className="header-heading" id="header-main-title">
          {config.title}
        </h1>
        <p className="header-subheading" id="header-sub-text">
          {config.subtitle}
        </p>
      </div>

      <div className="header-right">
        {/* Search field */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="global-search"
            placeholder="Search jobs, candidates..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

        {/* Theme Toggle */}
        <button
          className="btn-theme-toggle"
          id="btn-theme-toggle"
          aria-label="Toggle Theme"
          onClick={toggleTheme}
        >
          {isLight ? (
            <Sun size={16} strokeWidth={2} className="theme-icon-sun" />
          ) : (
            <Moon size={16} strokeWidth={2} className="theme-icon-moon" />
          )}
        </button>

        {/* Contextual action button */}
        {config.actionLabel && (
          <button
            className="btn-action"
            id="header-action-btn"
            onClick={() => openDrawer(config.actionType ?? 'job')}
          >
            <span className="btn-icon">+</span>
            <span id="header-action-btn-text">{config.actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
