'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { Job, Candidate } from '@/context/AppContext';
import { soundEngine } from '@/components/SoundEngine';
import { Play, Pause } from 'lucide-react';

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateJobId() {
  const chars = '0123456789ABCDEF';
  let id = 'AKRO62EF45E2';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── Create Job Drawer ──────────────────────────────────────────────────────

export function CreateJobDrawer() {
  const { activeDrawer, closeDrawer, addJob, addApplicant } = useAppContext();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const roleName = fd.get('roleName') as string;
    const cardName = fd.get('cardName') as string;
    const expBand = fd.get('expBand') as string;
    let customId = (fd.get('customId') as string)?.trim() || '-';

    const addResume = (form.querySelector('#chk-resume') as HTMLInputElement)?.checked;
    const addScreening = (form.querySelector('#chk-screening') as HTMLInputElement)?.checked;
    const addFunctional = (form.querySelector('#chk-functional') as HTMLInputElement)?.checked;

    const firstNames = ['Lucas', 'Sofia', 'Marcus', 'Chloe', 'Daniel', 'Amina'];
    const lastNames = ['Chen', 'Silva', 'Taylor', 'Nakamura', 'Oki', 'Ali'];
    const newCandidates: Array<{ name: string; email: string; status: Candidate['status'] }> = [];

    const makeCand = (status: Candidate['status']) => {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const email = `${name.toLowerCase().replace(' ', '.')}@recruit.io`;
      newCandidates.push({ name, email, status });
    };

    if (addResume) makeCand('Resume');
    if (addScreening) { makeCand('Screening'); makeCand('Screening'); }
    if (addFunctional) makeCand('Functional');

    const newJob: Job = {
      id: '',
      roleName, cardName,
      created: '',
      status: 'published',
      customJobId: customId,
      experienceBand: expBand,
      createdBy: 'Devasri',
      pipeline: {
        total: 0,
        resume: 0,
        screening: 0,
        functional: 0,
      },
    };

    addJob(newJob).then((createdJob) => {
      if (!createdJob) return;
      newCandidates.forEach((cand) => {
        addApplicant(createdJob.id, cand);
      });
    });

    soundEngine.playChime([261.63, 392.00, 523.25], 0.2, 0.08); // Confirmation chime
    form.reset();
    closeDrawer();
  };

  return (
    <div className={`slide-drawer${activeDrawer === 'job' ? ' active' : ''}`} id="drawer-job">
      <div className="drawer-header">
        <h2 className="drawer-title">Create Job Posting</h2>
        <button className="btn-close-drawer" onClick={closeDrawer} aria-label="Close panel">×</button>
      </div>
      <div className="drawer-body">
        <form id="form-create-job" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="job-role-input">Role Name</label>
            <input type="text" id="job-role-input" name="roleName" placeholder="e.g. Senior Frontend Architect" required />
          </div>
          <div className="form-group">
            <label htmlFor="job-card-input">Card Visual Name</label>
            <input type="text" id="job-card-input" name="cardName" placeholder="e.g. Next.js Core Lead Developer" required />
          </div>
          <div className="form-group">
            <label htmlFor="job-exp-input">Experience Level</label>
            <select id="job-exp-input" name="expBand">
              <option value="Upto 2 Years">Upto 2 Years</option>
              <option value="1-4 Years">1-4 Years</option>
              <option value="3-6 Years">3-6 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="job-custom-id">Custom Job ID (Optional)</label>
            <input type="text" id="job-custom-id" name="customId" placeholder="e.g. AKRO62EF45E26E54" />
          </div>
          <div className="form-group">
            <label htmlFor="job-creator-input">Created By</label>
            <input type="text" id="job-creator-input" value="Devasri" readOnly />
          </div>
          <div className="form-group">
            <label>Initial Pipeline Statuses</label>
            <div className="pipeline-checkbox-list">
              <label className="pipeline-check-item">
                <input type="checkbox" id="chk-resume" defaultChecked />
                <span>Resume Analysis</span>
              </label>
              <label className="pipeline-check-item">
                <input type="checkbox" id="chk-screening" defaultChecked />
                <span>Recruiter Screening</span>
              </label>
              <label className="pipeline-check-item">
                <input type="checkbox" id="chk-functional" defaultChecked />
                <span>Functional Interview</span>
              </label>
            </div>
          </div>
          <button type="submit" className="btn-drawer-submit">Create Job Card</button>
        </form>
      </div>
    </div>
  );
}

// ─── Invite Member Drawer ───────────────────────────────────────────────────

export function InviteMemberDrawer() {
  const { activeDrawer, closeDrawer, addTeamMember } = useAppContext();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addTeamMember({
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      designation: fd.get('designation') as string,
      usertype: fd.get('usertype') as string,
      registeredOn: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'Invited',
    });
    soundEngine.playChime([261.63, 392.00, 523.25], 0.2, 0.08); // Confirmation chime
    e.currentTarget.reset();
    closeDrawer();
  };

  return (
    <div className={`slide-drawer${activeDrawer === 'member' ? ' active' : ''}`} id="drawer-member">
      <div className="drawer-header">
        <h2 className="drawer-title">Invite Member</h2>
        <button className="btn-close-drawer" onClick={closeDrawer} aria-label="Close panel">×</button>
      </div>
      <div className="drawer-body">
        <form id="form-invite-member" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="member-name-input">Full Name</label>
            <input type="text" id="member-name-input" name="name" placeholder="e.g. Aditya Rana" required />
          </div>
          <div className="form-group">
            <label htmlFor="member-email-input">Work Email</label>
            <input type="email" id="member-email-input" name="email" placeholder="e.g. aditya@interviehire.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="member-designation-input">Designation</label>
            <input type="text" id="member-designation-input" name="designation" placeholder="e.g. Technical Director" required />
          </div>
          <div className="form-group">
            <label htmlFor="member-role-input">Usertype Role</label>
            <select id="member-role-input" name="usertype">
              <option value="Org. Admin">Org. Admin</option>
              <option value="Recruiter">Recruiter (Screening)</option>
              <option value="Interviewer">Interviewer (Expert Vetting)</option>
            </select>
          </div>
          <button type="submit" className="btn-drawer-submit">Send Email Invitation</button>
        </form>
      </div>
    </div>
  );
}

// ─── Candidate Report Drawer ───────────────────────────────────────────────

const CandidateReviews: Record<string, { file: string; code: string; reviewer: string; initials: string; comment: string }> = {
  'CAN-8234-EA1': {
    file: 'App.jsx (React)',
    code: `<span class="keyword">import</span> { useState, useEffect } <span class="keyword">from</span> <span class="string">'react'</span>;\n\n<span class="keyword">export default function</span> <span class="func">UserList</span>() {\n  <span class="keyword">const</span> [users, setUsers] = useState([]);\n  <span class="keyword">const</span> [loading, setLoading] = useState(<span class="keyword">true</span>);\n\n  useEffect(() =&gt; {\n    <span class="keyword">const</span> controller = <span class="keyword">new</span> <span class="class-name">AbortController</span>();\n    <span class="func">fetchUsers</span>(controller.signal);\n    <span class="keyword">return</span> () =&gt; controller.abort();\n  }, []);`,
    reviewer: 'Sarah J.',
    initials: 'SJ',
    comment: 'Excellent cleanup hook. Aditya handles asynchronous API mounts using the correct React AbortController pattern. Prevents race conditions and memory leaks.'
  },
  'CAN-7128-DF5': {
    file: 'tender_process.go (Golang)',
    code: `<span class="keyword">package</span> main\n\n<span class="keyword">import</span> (\n  <span class="string">"context"</span>\n  <span class="string">"time"</span>\n)\n\n<span class="keyword">func</span> <span class="func">ProcessTender</span>(ctx context.Context, id <span class="keyword">string</span>) <span class="keyword">error</span> {\n  ctx, cancel := context.WithTimeout(ctx, 5*time.Second)\n  <span class="keyword">defer</span> cancel()\n  \n  <span class="keyword">return</span> <span class="func">FetchTenderDetails</span>(ctx, id)\n}`,
    reviewer: 'Sarah J.',
    initials: 'SJ',
    comment: 'Devasri has structured this scraper with clean worker pools and context timeouts. Excellent handling of HTTP request parameters.'
  },
  'CAN-3401-EA1': {
    file: 'HomeLayout.css (CSS3)',
    code: `<span class="keyword">.grid-container</span> {\n  <span class="keyword">display</span>: grid;\n  <span class="keyword">grid-template-columns</span>: repeat(auto-fit, minmax(280px, 1fr));\n  <span class="keyword">gap</span>: 1.5rem;\n  <span class="keyword">padding</span>: 2rem;\n  <span class="keyword">background-color</span>: <span class="string">var(--color-bg)</span>;\n}`,
    reviewer: 'Sarah J.',
    initials: 'SJ',
    comment: 'Ines uses modern semantic CSS grid and variables. Clean, legible code structure.'
  },
  'CAN-9012-EA2': {
    file: 'auth_helper.py (Python)',
    code: `<span class="keyword">import</span> jwt\n<span class="keyword">from</span> datetime <span class="keyword">import</span> datetime, timedelta\n\n<span class="keyword">def</span> <span class="func">create_token</span>(user_id: str) -&gt; str:\n  payload = {\n    <span class="string">'sub'</span>: user_id,\n    <span class="string">'exp'</span>: datetime.utcnow() + timedelta(days=1)\n  }\n  <span class="keyword">return</span> jwt.encode(payload, <span class="string">'SECRET_KEY'</span>, algorithm=<span class="string">'HS256'</span>)`,
    reviewer: 'Sarah J.',
    initials: 'SJ',
    comment: 'Sarah uses robust encryption packages. Recommended addition of rate limit headers.'
  }
};

export function CandidateReportDrawer() {
  const { activeDrawer, closeDrawer, reportCandidateId, candidates } = useAppContext();
  const [activeTab, setActiveTab] = useState<'rubric' | 'code'>('rubric');
  
  // Waveform state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalBars = 28;
  const duration = 12000; // 12 seconds
  
  // Clean up timer on close or unmount
  useEffect(() => {
    if (activeDrawer !== 'report') {
      resetWaveform();
    }
  }, [activeDrawer]);

  const candidate = useMemo(() => {
    if (!reportCandidateId) return null;
    return candidates.find(c => c.id === reportCandidateId) || null;
  }, [reportCandidateId, candidates]);

  const review = useMemo(() => {
    if (!reportCandidateId) return CandidateReviews['CAN-8234-EA1'];
    return CandidateReviews[reportCandidateId] || CandidateReviews['CAN-8234-EA1'];
  }, [reportCandidateId]);

  const rubrics = useMemo(() => {
    if (!candidate) return { coding: '0.0', sysDesign: '0.0', comm: '0.0', probSolving: '0.0' };
    const numericScore = parseFloat(candidate.score) || 90;
    return {
      coding: (numericScore / 10).toFixed(1),
      sysDesign: ((numericScore - 4 - Math.random() * 4) / 10).toFixed(1),
      comm: ((numericScore + 2 - Math.random() * 4) / 10).toFixed(1),
      probSolving: ((numericScore - 2 - Math.random() * 3) / 10).toFixed(1)
    };
  }, [candidate]);

  // Generate random heights for waveform bars once
  const barHeights = useMemo(() => {
    return Array.from({ length: totalBars }, () => Math.floor(Math.random() * 80 + 10));
  }, []);

  const resetWaveform = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setIsPlaying(false);
    setPlayTime(0);
  };

  const toggleWaveform = () => {
    if (isPlaying) {
      resetWaveform();
      soundEngine.playClick();
    } else {
      soundEngine.playChime([440, 554.37], 0.1, 0.05);
      setIsPlaying(true);
      
      playIntervalRef.current = setInterval(() => {
        setPlayTime(prev => {
          if (prev >= duration - 100) {
            if (playIntervalRef.current) clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            soundEngine.playChime([523.25, 392], 0.15, 0.08);
            return 0;
          }
          return prev + 100;
        });
      }, 100);
    }
  };

  if (!candidate) return null;

  const initials = candidate.name.split(' ').map(n => n[0]).join('');
  const activeBarCount = Math.floor((playTime / duration) * totalBars);

  return (
    <div className={`slide-drawer${activeDrawer === 'report' ? ' active' : ''}`} id="drawer-report" style={{ width: '520px' }}>
      <div className="drawer-header">
        <h2 className="drawer-title">Vetting Report</h2>
        <button className="btn-close-drawer" onClick={() => { soundEngine.playClick(); closeDrawer(); }} aria-label="Close panel">×</button>
      </div>
      <div className="drawer-body" style={{ padding: 0 }}>
        <div className="candidate-profile-summary">
          <div className="cand-avatar-large" id="report-avatar">{initials}</div>
          <div className="cand-info-large">
            <h3 className="cand-name-large" id="report-name">{candidate.name}</h3>
            <p className="cand-email-large" id="report-email">{candidate.email}</p>
            <p className="cand-job-applied" id="report-job">{candidate.jobApplied}</p>
          </div>
          <div className="cand-score-large" id="report-score">{candidate.score}</div>
        </div>

        {/* Tabs for Rubrics / Code review */}
        <div className="report-tabs">
          <button
            className={`report-tab-btn ${activeTab === 'rubric' ? 'active' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('rubric'); }}
          >
            Evaluation Rubrics
          </button>
          <button
            className={`report-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('code'); }}
          >
            Expert Code Review
          </button>
        </div>

        <div className="report-content-body">
          {/* Rubric content */}
          {activeTab === 'rubric' && (
            <div className="report-tab-content active" id="rep-tab-rubric">
              <div className="rubric-list">
                <div className="rubric-item">
                  <div className="rubric-meta">
                    <span>Coding Proficiency</span>
                    <strong className="val">{rubrics.coding} / 10</strong>
                  </div>
                  <div className="bar-outer">
                    <div className="bar-inner" style={{ width: `${parseFloat(rubrics.coding) * 10}%` }}></div>
                  </div>
                </div>
                <div className="rubric-item">
                  <div className="rubric-meta">
                    <span>System Design</span>
                    <strong className="val">{rubrics.sysDesign} / 10</strong>
                  </div>
                  <div className="bar-outer">
                    <div className="bar-inner" style={{ width: `${parseFloat(rubrics.sysDesign) * 10}%` }}></div>
                  </div>
                </div>
                <div className="rubric-item">
                  <div className="rubric-meta">
                    <span>Communication</span>
                    <strong className="val">{rubrics.comm} / 10</strong>
                  </div>
                  <div className="bar-outer">
                    <div className="bar-inner" style={{ width: `${parseFloat(rubrics.comm) * 10}%` }}></div>
                  </div>
                </div>
                <div className="rubric-item">
                  <div className="rubric-meta">
                    <span>Problem Solving</span>
                    <strong className="val">{rubrics.probSolving} / 10</strong>
                  </div>
                  <div className="bar-outer">
                    <div className="bar-inner" style={{ width: `${parseFloat(rubrics.probSolving) * 10}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Waveform snippet */}
              <div className="waveform-box">
                <h4 className="waveform-title">Expert Human Interview Snippet</h4>
                <div className="waveform-controls">
                  <button className="btn-play-waveform" id="btn-play-wave" aria-label="Play Interview Snippet" onClick={toggleWaveform}>
                    {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <div className="waveform-viz" id="waveform-viz-bars">
                    {barHeights.map((h, i) => (
                      <div
                        key={i}
                        className={`wave-bar ${i < activeBarCount ? 'played' : ''}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <span className="waveform-time" id="waveform-timer">
                    0:{Math.floor(playTime / 1000).toString().padStart(2, '0')} / 0:12
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Code review content */}
          {activeTab === 'code' && (
            <div className="report-tab-content active" id="rep-tab-code">
              <div className="code-editor-header">
                <span className="file-name">{review.file}</span>
              </div>
              <div className="code-editor-body">
                <pre className="code-view-container">
                  <code dangerouslySetInnerHTML={{ __html: review.code }} />
                </pre>
                
                {/* Comment by human reviewer */}
                <div className="code-review-comment">
                  <div className="code-review-comment-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="author-tag" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--color-gold-dim)',
                      border: '1px solid var(--color-gold)',
                      color: 'var(--color-gold-light)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {review.initials}
                    </span>
                    <div className="author-meta">
                      <span className="author-name" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{review.reviewer}</span>
                      <span className="author-desc" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Sr. Frontend Engineer // Reviewer
                      </span>
                    </div>
                  </div>
                  <p className="comment-body" style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--color-text-normal)' }}>
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drawer Backdrop ────────────────────────────────────────────────────────

export function DrawerBackdrop() {
  const { activeDrawer, closeDrawer } = useAppContext();

  return (
    <div
      className={`drawer-backdrop${activeDrawer ? ' active' : ''}`}
      id="drawer-backdrop"
      onClick={closeDrawer}
    />
  );
}
