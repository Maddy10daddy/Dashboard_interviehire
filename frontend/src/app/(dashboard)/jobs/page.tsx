'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Package } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function JobsPage() {
  const router = useRouter();
  const { jobs, candidates, globalSearch, advanceCandidate, recalculateJobPipelines } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'board'>('cards');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filter !== 'all' && job.status !== filter) return false;
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        return job.roleName.toLowerCase().includes(q) || job.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobs, filter, globalSearch]);

  const counts = useMemo(() => ({
    all: jobs.length,
    published: jobs.filter(j => j.status === 'published').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    archived: jobs.filter(j => j.status === 'archived').length,
  }), [jobs]);

  // Kanban columns
  const kanbanData = useMemo(() => {
    const q = globalSearch.toLowerCase();
    const filtered = candidates.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.jobApplied.toLowerCase().includes(q)
    );
    return {
      Resume: filtered.filter(c => c.status === 'Resume'),
      Screening: filtered.filter(c => c.status === 'Screening'),
      Functional: filtered.filter(c => c.status === 'Functional'),
      Hired: filtered.filter(c => c.status === 'Hired'),
    };
  }, [candidates, globalSearch]);

  return (
    <section className="dashboard-view active-view" id="view-jobs">
      {/* Filtering Sub-bar */}
      <div className="view-filter-bar">
        <div className="filter-options">
          {(['all', 'published', 'draft', 'archived'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              data-filter={f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} (
              <span className={`count-${f}`}>{counts[f]}</span>)
            </button>
          ))}
        </div>

        {/* Layout view selectors */}
        <div className="layout-toggle-group">
          <button
            className={`layout-toggle-btn${viewMode === 'cards' ? ' active' : ''}`}
            id="btn-view-cards"
            title="Cards View"
            onClick={() => setViewMode('cards')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
          </button>
          <button
            className={`layout-toggle-btn${viewMode === 'board' ? ' active' : ''}`}
            id="btn-view-board"
            title="Pipeline Kanban Board"
            onClick={() => setViewMode('board')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </button>
        </div>

        <div className="filter-meta">
          <span className="meta-label">Created by:</span>
          <select className="meta-select" id="jobs-creator-select">
            <option value="all">All</option>
            <option value="me">Devasri</option>
          </select>
        </div>
      </div>

      {/* Jobs Cards Grid */}
      {viewMode === 'cards' && (
        <div className="jobs-cards-grid" id="jobs-list-container">
          {filteredJobs.length === 0 ? (
            <div className="empty-state card-glass" style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <h3 className="type-h3" style={{ marginBottom: 8 }}>No jobs found</h3>
              <p className="type-caption">No job postings match your filters. Create a new job to start recruitment.</p>
            </div>
          ) : (
            filteredJobs.map(job => {
              const resumeVal = !job.pipeline.resume ? '-' : job.pipeline.resume;
              const screeningVal = !job.pipeline.screening ? '-' : job.pipeline.screening;
              const functionalVal = !job.pipeline.functional ? '-' : job.pipeline.functional;

              return (
                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="job-card-header">
                    <div className="job-card-title-area">
                      <h3 className="job-title">{job.cardName}</h3>
                      <span className="job-meta-pill">Role: {job.roleName}</span>
                    </div>
                    <span className={`status-badge ${job.status}`}>
                      <span className="status-badge-dot" />
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>

                  <div className="job-card-details">
                    <div className="detail-item">
                      <Clock size={14} />
                      <span>Created: {job.created}</span>
                    </div>
                    <div className="detail-item">
                      <Package size={14} />
                      <span>Experience: {job.experienceBand}</span>
                    </div>
                  </div>

                  <div className="pipeline-flow">
                    <div className="pipeline-step step-total">
                      <span className="step-label">Total</span>
                      <span className="step-val">{job.pipeline.total}</span>
                    </div>
                    <span className="pipeline-arrow">→</span>
                    <div className="pipeline-step step-resume">
                      <span className="step-label">Resume</span>
                      <span className="step-val">{resumeVal}</span>
                    </div>
                    <span className="pipeline-arrow">→</span>
                    <div className="pipeline-step step-screening">
                      <span className="step-label">Screening</span>
                      <span className="step-val">{screeningVal}</span>
                    </div>
                    <span className="pipeline-arrow">→</span>
                    <div className="pipeline-step step-functional">
                      <span className="step-label">Functional</span>
                      <span className="step-val">{functionalVal}</span>
                    </div>
                  </div>

                  <div className="job-card-footer">
                    <div className="author-info">
                      <div className="author-tag">{job.createdBy.charAt(0)}</div>
                      <span className="author-meta">{job.createdBy} (me) // <a href="#" className="author-link-doc" onClick={e => e.stopPropagation()}>Job Description</a></span>
                    </div>
                    <span className="card-responses-cta">
                      View Responses
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Kanban board */}
      {viewMode === 'board' && (
        <div className="kanban-board-container" id="jobs-board-container" style={{ display: 'grid' }}>
          {(['Resume', 'Screening', 'Functional', 'Hired'] as const).map(stage => (
            <div key={stage} className="kanban-column" data-stage={stage}>
              <h3 className="kanban-col-title">
                {stage === 'Resume' ? 'Resume Analysis' : stage === 'Screening' ? 'Recruiter Screening' : stage === 'Functional' ? 'Functional Interview' : 'Hired'}
                {' '}(<span className="col-count">{kanbanData[stage].length}</span>)
              </h3>
              <div className="kanban-cards-list">
                {kanbanData[stage].map(c => (
                  <div key={c.id} className="kanban-card">
                    <div className="kanban-card-title">{c.name}</div>
                    <div className="kanban-card-job">{c.jobApplied}</div>
                    <div className="kanban-card-footer">
                      <span className="kanban-card-score">{c.score}</span>
                      {stage === 'Hired' ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ Hired</span>
                      ) : (
                        <button className="btn-advance-kanban" onClick={() => { advanceCandidate(c.id); recalculateJobPipelines(); }}>Advance →</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
