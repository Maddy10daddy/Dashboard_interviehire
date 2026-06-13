'use client';

import React, { useState, useEffect } from 'react';
import { soundEngine } from '@/components/SoundEngine';
import { Copy, CheckCircle2, ExternalLink, Sparkles, Globe } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CareerPage() {
  const { jobs } = useAppContext();
  const [subdomain, setSubdomain] = useState('devasri-tech');
  const [themeMode, setThemeMode] = useState('dark');
  const [intro, setIntro] = useState('Build the future of technology with us.');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [origin, setOrigin] = useState('https://app.interviehire.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

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
        body: JSON.stringify({ org_name: subdomain, domain: subdomain, description: intro })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Error updating career settings:', err);
    }
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(id);
      soundEngine.playChime([523.25, 659.25], 0.1, 0.04);
      setTimeout(() => setCopiedLink(null), 2500);
    });
  };

  const publishedJobs = jobs.filter(j => j.status === 'published');

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
              <select id="career-theme" value={themeMode} onChange={(e) => setThemeMode(e.target.value)}>
                <option value="dark">Dark Slate Brand Theme (Default)</option>
                <option value="light">Crisp Editorial Light Theme</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="career-intro">Hero Headline Introduction</label>
              <input type="text" id="career-intro" value={intro} onChange={(e) => setIntro(e.target.value)} />
            </div>
            <button
              type="submit"
              className="btn-submit"
              style={saveStatus === 'saved' ? { background: 'var(--color-success)', color: '#fff' } : undefined}
            >
              {saveStatus === 'saved' ? '✓ Saved Settings!' : 'Save Configurations'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-glass panel-preview">
            <h3 className="panel-title">Live Subdomain Status</h3>
            <div className="status-indicator-box">
              <span className="pulsing-dot green"></span>
              <div className="status-text">
                <div className="status-title">Live &amp; Active</div>
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

          {/* Published Job Interview Links */}
          <div className="card-glass" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Globe size={16} style={{ color: 'var(--color-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>Interview Links by Job</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Share these unique interview links directly with candidates.
            </p>
            {publishedJobs.length === 0 ? (
              <p style={{ color: 'var(--color-text-faint)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No published jobs yet. Publish a job to generate interview links.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {publishedJobs.map(job => {
                  const link = `${origin}/apply/${job.id}`;
                  const isCopied = copiedLink === job.id;
                  return (
                    <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: 2 }}>{job.roleName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => copyLink(link, job.id)}
                          style={{
                            background: isCopied ? 'rgba(34,197,94,0.12)' : 'rgba(var(--color-gold-rgb),0.1)',
                            border: `1px solid ${isCopied ? 'rgba(34,197,94,0.3)' : 'rgba(var(--color-gold-rgb),0.25)'}`,
                            color: isCopied ? '#22c55e' : 'var(--color-gold)',
                            borderRadius: 8, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
                          }}
                        >
                          {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          {isCopied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* General invite link */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>General Career Portal</div>
              <button
                onClick={() => copyLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/careers/${subdomain}`, 'general')}
                style={{ width: '100%', background: 'rgba(var(--color-indigo-rgb),0.08)', border: '1px solid rgba(var(--color-indigo-rgb),0.2)', color: 'var(--color-indigo)', borderRadius: 8, padding: '10px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {copiedLink === 'general' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copiedLink === 'general' ? 'Copied!' : `Copy Career Portal Link`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
