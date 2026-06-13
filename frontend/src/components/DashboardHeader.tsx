'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Moon, Sun, Sparkles } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { soundEngine } from '@/components/SoundEngine';

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
  const router = useRouter();
  const { jobs, globalSearch, setGlobalSearch, openDrawer } = useAppContext();
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const [isCrystal, setIsCrystal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('interviehire-crystal');
    if (saved !== 'false') {
      document.body.classList.add('liquid-crystal-theme');
      setIsCrystal(true);
      if (!saved) {
        localStorage.setItem('interviehire-crystal', 'true');
      }
    }
  }, []);

  const toggleCrystal = () => {
    const next = !isCrystal;
    setIsCrystal(next);
    document.body.classList.toggle('liquid-crystal-theme', next);
    localStorage.setItem('interviehire-crystal', next ? 'true' : 'false');
    soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.15, 0.08);
  };

  // Find matching config (handle dynamic routes like /jobs/[id] and /jobs/[id]/sourcing)
  let config = pathname ? HEADER_CONFIG[pathname] : null;
  if (!config) {
    if (pathname && pathname.startsWith('/jobs/')) {
      const parts = pathname.split('/');
      const jobId = parts[2];
      const job = jobs.find(j => j.id === jobId);
      const isSourcing = parts[3] === 'sourcing';

      if (isSourcing) {
        config = {
          breadcrumb: 'Sourcing',
          title: job ? `Source Applicants • ${job.roleName}` : 'Source Applicants',
          subtitle: job ? `Sourcing channel selection for ${job.roleName} (ID: ${job.customJobId})` : 'Choose integration, CSV upload, or manual sourcing',
        };
      } else {
        config = {
          breadcrumb: 'Jobs',
          title: job ? job.cardName : 'Job Detail',
          subtitle: job ? `Role: ${job.roleName} • ID: ${job.customJobId} • ${job.experienceBand} • Created by ${job.createdBy}` : 'View candidate responses and funnel metrics',
        };
      }
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
            {mounted ? config.breadcrumb : 'Dashboard'}
          </span>
        </div>
        <h1 className="header-heading" id="header-main-title">
          {mounted ? config.title : 'Dashboard'}
        </h1>
        <p className="header-subheading" id="header-sub-text">
          {mounted ? config.subtitle : ''}
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
          style={{ marginRight: '8px' }}
          onClick={toggleTheme}
        >
          {isLight ? (
            <Sun size={16} strokeWidth={2} className="theme-icon-sun" />
          ) : (
            <Moon size={16} strokeWidth={2} className="theme-icon-moon" />
          )}
        </button>

        {/* Liquid Crystal Toggle */}
        <button
          className="btn-theme-toggle"
          style={{
            borderColor: isCrystal ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)',
            color: isCrystal ? 'oklch(58% 0.22 286)' : 'var(--color-text-muted)',
            marginRight: '8px',
          }}
          title="Toggle Crystal Glass Theme"
          onClick={toggleCrystal}
        >
          <Sparkles size={16} style={{ transform: isCrystal ? 'rotate(15deg) scale(1.1)' : 'none', transition: 'transform 0.3s ease' }} />
        </button>

        {/* Contextual action button */}
        {mounted && config.actionLabel && (
          <button
            className="btn-action"
            id="header-action-btn"
            onClick={() => config.actionType === 'job' ? router.push('/jobs/create') : openDrawer(config.actionType ?? 'job')}
          >
            <span className="btn-icon">+</span>
            <span id="header-action-btn-text">{config.actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
