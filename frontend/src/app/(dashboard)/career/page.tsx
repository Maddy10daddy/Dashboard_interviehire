'use client';

import React, { useState, useEffect } from 'react';
import { soundEngine } from '@/components/SoundEngine';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CareerPage() {
  const [subdomain, setSubdomain] = useState('devasri-tech');
  const [themeMode, setThemeMode] = useState('dark');
  const [intro, setIntro] = useState('Build the future of technology with us.');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    const fetchCareerSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/career`);
        if (res.ok) {
          const data = await res.json();
          if (data.domain) setSubdomain(data.domain);
          if (data.description) setIntro(data.description);
        }
      } catch (err) {
        console.error('Error fetching career settings:', err);
      }
    };
    fetchCareerSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playChime([523.25], 0.15);
    
    try {
      const res = await fetch(`${API_URL}/api/career`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: subdomain,
          domain: subdomain,
          description: intro
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }
    } catch (err) {
      console.error('Error updating career settings:', err);
    }
  };

  return (
    <section className="dashboard-view active-view" id="view-career">
      <div className="config-grid">
        <div className="card-glass panel-setting">
          <h3 className="panel-title">Career Page Settings</h3>
          <p className="panel-desc">Configure your public career subdomain page and listing styling rules.</p>

          <form className="settings-form" id="career-settings-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="career-subdomain">Company Subdomain</label>
              <div className="input-prefix-wrap">
                <span className="prefix">interviehire.com/careers/</span>
                <input
                  type="text"
                  id="career-subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="career-theme">Portal Theme Mode</label>
              <select
                id="career-theme"
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
              >
                <option value="dark">Dark Slate Brand Theme (Default)</option>
                <option value="light">Crisp Editorial Light Theme</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="career-intro">Hero Headline Introduction</label>
              <input
                type="text"
                id="career-intro"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-submit"
              style={
                saveStatus === 'saved'
                  ? { background: 'var(--color-success)', color: '#fff' }
                  : undefined
              }
            >
              {saveStatus === 'saved' ? '✓ Saved Settings!' : 'Save Configurations'}
            </button>
          </form>
        </div>

        <div className="card-glass panel-preview">
          <h3 className="panel-title">Live Subdomain Status</h3>
          <div className="status-indicator-box">
            <span className="pulsing-dot green"></span>
            <div className="status-text">
              <div className="status-title">Live & Active</div>
              <a
                href={`https://interviehire.com/careers/${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="status-link"
              >
                interviehire.com/careers/{subdomain} ↗
              </a>
            </div>
          </div>
          <div className="meta-metric-box">
            <div className="sub-metric">
              <span className="lbl">Subdomain Visits</span>
              <span className="val">142</span>
            </div>
            <div className="sub-metric">
              <span className="lbl">Apply Rate</span>
              <span className="val">12.4%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
