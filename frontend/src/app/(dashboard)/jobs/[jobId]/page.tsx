'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import { Filter, Search, Users, Calendar, BarChart3, Info } from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { jobs, candidates } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'screening' | 'functional'>('overview');

  const job = jobs.find(j => j.id === jobId);

  const jobCandidates = useMemo(() => {
    if (!job) return [];
    return candidates.filter(c => c.jobApplied === job.roleName || c.jobApplied === job.cardName);
  }, [job, candidates]);

  if (!job) {
    return (
      <section className="dashboard-view active-view">
        <div className="empty-state card-glass" style={{ padding: 48, textAlign: 'center' }}>
          <h3 className="type-h3" style={{ marginBottom: 8 }}>Job not found</h3>
          <p className="type-caption">The job you are looking for does not exist.</p>
          <button className="btn-action" style={{ marginTop: 16 }} onClick={() => router.push('/jobs')}>← Back to Jobs</button>
        </div>
      </section>
    );
  }

  const total = Math.max(job.pipeline.total, 1);
  const completed = job.pipeline.functional > 0 ? 1 : 0;
  const stages = [
    { count: job.pipeline.total, label: 'Total Candidates', conv: null as number | null },
    { count: job.pipeline.resume, label: 'Resume Analysis', conv: Math.round((job.pipeline.resume / total) * 100) },
    { count: job.pipeline.screening, label: 'Recruiter Screening', conv: Math.round((job.pipeline.screening / total) * 100) },
    { count: job.pipeline.functional, label: 'Functional Interview', conv: Math.round((job.pipeline.functional / total) * 100) },
    { count: completed, label: 'Completed', conv: Math.round((completed / total) * 100) },
    { count: completed, label: 'Qualified', conv: Math.round((completed / total) * 100) },
  ];

  // Insights
  const insights: Array<{ type: string; text: string }> = [];
  if (job.pipeline.total === 0) {
    insights.push({ type: 'info', text: 'No candidates yet. Share interview links to start receiving applications.' });
  } else {
    const screeningPct = Math.round((job.pipeline.screening / total) * 100);
    if (job.pipeline.resume === 0) {
      insights.push({ type: 'warn', text: 'Resume Analysis stage has 0 candidates — consider enabling resume screening in job settings.' });
    }
    if (screeningPct >= 50) {
      insights.push({ type: 'good', text: `Strong ${screeningPct}% conversion to Recruiter Screening — pipeline quality is high.` });
    }
    if (job.pipeline.functional > 0) {
      insights.push({ type: 'good', text: `${job.pipeline.functional} candidate${job.pipeline.functional > 1 ? 's' : ''} reached Functional Interview.` });
    }
  }
  if (insights.length === 0) {
    insights.push({ type: 'info', text: 'Funnel data looks healthy. Continue monitoring candidate progress.' });
  }

  const screeningCandidates = jobCandidates.filter(c => c.status === 'Screening' || c.status === 'Functional' || c.status === 'Hired');
  const functionalCandidates = jobCandidates.filter(c => c.status === 'Functional' || c.status === 'Hired');

  return (
    <section className="dashboard-view active-view" id="view-job-detail">
      {/* Sub-nav: tabs + action bar */}
      <div className="jd-subnav">
        <div className="jd-tabs">
          <button className={`jd-tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`jd-tab${activeTab === 'resume' ? ' active' : ''}`} onClick={() => setActiveTab('resume')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Resume Analysis
          </button>
          <button className={`jd-tab${activeTab === 'screening' ? ' active' : ''}`} onClick={() => setActiveTab('screening')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            Recruiter Screening <span className="jd-count-pill">{job.pipeline.screening}</span>
          </button>
          <button className={`jd-tab${activeTab === 'functional' ? ' active' : ''}`} onClick={() => setActiveTab('functional')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            Functional Interview <span className="jd-count-pill">{job.pipeline.functional}</span>
          </button>
        </div>
        <div className="jd-actions">
          <button className="btn-jd-ghost" onClick={() => router.push('/jobs')}>← Back to Jobs</button>
          <button className="btn-jd-primary" onClick={() => router.push(`/jobs/${job.id}/sourcing`)}>+ Add Applicants</button>
        </div>
      </div>

      {/* Tab panes */}
      <div className="jd-panes">
        {/* Overview pane */}
        {activeTab === 'overview' && (
          <div className="jd-pane active" id="jd-pane-overview">
            <div className="jd-overview-grid">
              {/* Left: Candidate Funnel */}
              <div className="card-glass jd-funnel-card">
                <div className="jd-panel-header">
                  <Filter size={15} stroke="var(--color-orange)" />
                  <h3 className="jd-card-title">Candidate Funnel</h3>
                </div>
                <div className="jd-funnel-body">
                  <div className="jd-funnel-stages" id="jd-funnel-stages">
                    {stages.map((s, i) => (
                      <div key={i} className="jd-stage-item">
                        <div className="jds-count">{s.count}</div>
                        <div className="jds-label">{s.label}</div>
                        {s.conv !== null && <div className="jds-conv">{s.conv}% conversion</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="jd-funnel-legend">
                  <div className="jd-legend-item"><span className="jd-ldot" style={{ background: '#6366f1' }} />Career Page</div>
                  <div className="jd-legend-item"><span className="jd-ldot" style={{ background: '#06b6d4' }} />ATS</div>
                  <div className="jd-legend-item"><span className="jd-ldot" style={{ background: '#f59e0b' }} />Bulk Upload</div>
                  <div className="jd-legend-item"><span className="jd-ldot" style={{ background: '#ec4899' }} />Scheduled</div>
                  <div className="jd-legend-item"><span className="jd-ldot" style={{ background: '#10b981' }} />Direct Link</div>
                </div>
              </div>

              {/* Right: Insights */}
              <div className="jd-right-panels">
                <div className="card-glass jd-insights-card">
                  <div className="jd-panel-header">
                    <Info size={15} stroke="var(--color-gold)" />
                    <h3 className="jd-card-title">Funnel Insights</h3>
                    <span className="jd-badge-tag">Recommendations</span>
                  </div>
                  <div className="jd-insights-body">
                    {insights.map((ins, i) => (
                      <div key={i} className={`jd-insight-item ${ins.type}`}>
                        <span className="jd-insight-dot" />
                        <p>{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-glass jd-score-card">
                  <div className="jd-score-header">
                    <div className="jd-score-title-row">
                      <BarChart3 size={15} />
                      <h3 className="jd-card-title">Score Distribution</h3>
                    </div>
                    <select className="jd-score-select" id="jd-score-type">
                      <option value="interview">Interview Score</option>
                      <option value="resume">Resume Score</option>
                    </select>
                  </div>
                  <div className="jd-score-chart-wrap">
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      Score chart renders here
                    </div>
                  </div>
                  <div className="jd-score-legend">
                    <span className="jd-legend-item"><span className="jd-ldot" style={{ background: '#6366f1', borderRadius: 2 }} />Percentage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resume pane */}
        {activeTab === 'resume' && (
          <div className="jd-pane active" id="jd-pane-resume">
            <div className="jd-empty-pane">
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3 className="type-h3" style={{ marginBottom: 8 }}>Resume Analysis Pane</h3>
              <p className="type-caption">Detailed metrics on automated resume parsing models and pipeline filter triggers.</p>
            </div>
          </div>
        )}

        {/* Screening pane */}
        {activeTab === 'screening' && (
          <div className="jd-pane active" id="jd-pane-screening">
            <div className="jd-applicants-list">
              {screeningCandidates.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', padding: 32, textAlign: 'center' }}>No candidates at screening stage</p>
              ) : (
                screeningCandidates.map(c => (
                  <div key={c.id} className="card-glass" style={{ padding: 16, marginBottom: 12 }}>
                    <strong>{c.name}</strong> — {c.email} — Score: <strong style={{ color: 'var(--color-gold)' }}>{c.score}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Functional pane */}
        {activeTab === 'functional' && (
          <div className="jd-pane active" id="jd-pane-functional">
            <div className="jd-applicants-list">
              {functionalCandidates.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', padding: 32, textAlign: 'center' }}>No candidates at functional stage</p>
              ) : (
                functionalCandidates.map(c => (
                  <div key={c.id} className="card-glass" style={{ padding: 16, marginBottom: 12 }}>
                    <strong>{c.name}</strong> — {c.email} — Score: <strong style={{ color: 'var(--color-gold)' }}>{c.score}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
