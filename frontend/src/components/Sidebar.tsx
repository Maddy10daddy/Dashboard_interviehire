'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Briefcase,
  BarChart3,
  Monitor,
  Users,
  Globe,
  Settings,
  ChevronDown,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/jobs', label: 'Jobs', icon: Briefcase, tab: 'jobs' },
  { href: '/analytics', label: 'Usage Overview', icon: BarChart3, tab: 'analytics' },
  { href: '/swarm', label: 'AI Swarm', icon: Monitor, tab: 'swarm' },
  { href: '/team', label: 'Team Access', icon: Users, tab: 'team' },
  { href: '/career', label: 'Career Page', icon: Globe, tab: 'career' },
];

const SETTINGS_ITEMS = [
  { href: '/settings/password', label: 'Change Password', subtab: 'settings-password' },
  { href: '/settings/cookies', label: 'Cookie Settings', subtab: 'settings-cookies' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || pathname.startsWith('/jobs/');
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/jobs" className="logo-area">
        <img src="/Logo.png" alt="intervieHire Logo" className="logo-img" />
        <span className="logo-text">
          intervie<span className="logo-highlight">Hire</span>
        </span>
      </Link>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul>
          {NAV_ITEMS.map(({ href, label, icon: Icon, tab }) => (
            <li
              key={tab}
              className={`nav-item${isActive(href) ? ' active' : ''}`}
              data-tab={tab}
            >
              <Link href={href} style={{ display: 'contents' }}>
                <Icon size={20} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            </li>
          ))}

          {/* Settings with sub-nav */}
          <li
            className={`nav-item has-sub${pathname.startsWith('/settings') ? ' active' : ''}${settingsOpen ? ' open' : ''}`}
            data-tab="settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <div className="nav-item-header">
              <Settings size={20} strokeWidth={1.8} />
              <span>Settings</span>
              <ChevronDown size={14} className="chevron-icon" />
            </div>
            <ul className="sub-nav">
              {SETTINGS_ITEMS.map(({ href, label, subtab }) => (
                <li
                  key={subtab}
                  data-subtab={subtab}
                  className={pathname === href ? 'active-sub' : ''}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={href} style={{ display: 'contents' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Free Trial Plan Card */}
        <div className="card-plan">
          <div className="plan-header">
            <span className="plan-badge">Free Trial</span>
            <span className="plan-alert">Plan expired</span>
          </div>
          <button className="btn-upgrade">Upgrade Plan</button>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">D</div>
          <div className="user-info">
            <div className="user-name">Devasri</div>
            <div className="user-role">Org. Admin</div>
          </div>
          <button className="btn-logout" aria-label="Logout">
            <LogOut size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}
