'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Filter, Search, Users, Calendar, BarChart3, Info, Sparkles, Check, X, Plus, Trash2, ChevronDown, Award } from 'lucide-react';
import { soundEngine } from '@/components/SoundEngine';

// ─── EXTRACTED SUB-COMPONENTS TO PREVENT LOSS OF FOCUS ─────────────────────

function RenderResumeList({ 
  title, 
  list, 
  type, 
  colorClass, 
  setLocalResumeParams, 
  setHasChanges 
}: { 
  title: string; 
  list: string[]; 
  type: 'must_have' | 'red_flags' | 'good_to_have'; 
  colorClass: string;
  setLocalResumeParams: React.Dispatch<React.SetStateAction<any>>;
  setHasChanges: (val: boolean) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    setLocalResumeParams((prev: any) => ({
      ...prev,
      [type]: [...(prev[type] || []), newItem.trim()]
    }));
    setNewItem('');
    setHasChanges(true);
    soundEngine.playChime([329.63, 392.00], 0.08, 0.04);
  };

  const handleDelete = (index: number) => {
    setLocalResumeParams((prev: any) => ({
      ...prev,
      [type]: prev[type].filter((_: any, idx: number) => idx !== index)
    }));
    setHasChanges(true);
    soundEngine.playChime([392.00, 329.63], 0.08, 0.04);
  };

  return (
    <div className="card-glass" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`jd-ldot ${colorClass}`} />
          {title}
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            placeholder="Add requirement..." 
            value={newItem} 
            onChange={(e) => setNewItem(e.target.value)} 
            className="jd-score-select" 
            style={{ width: 220, padding: '4px 8px', borderRadius: 4, height: 28, fontSize: '0.8rem' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="btn-jd-primary" style={{ padding: '0 12px', height: 28, fontSize: '0.75rem' }} onClick={handleAdd}>
            <Plus size={12} style={{ marginRight: 4 }} /> Add
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(list || []).length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic', margin: '4px 0' }}>No criteria defined.</p>
        ) : (
          list.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <span>{item}</span>
              <button 
                onClick={() => handleDelete(idx)} 
                style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 2 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RenderScreeningSection({ 
  title, 
  items, 
  sectionType, 
  setLocalScreeningParams, 
  setHasChanges 
}: { 
  title: string; 
  items: any[]; 
  sectionType: 'experience' | 'location' | 'compensation';
  setLocalScreeningParams: React.Dispatch<React.SetStateAction<any>>;
  setHasChanges: (val: boolean) => void;
}) {
  const handleCheckboxChange = (index: number) => {
    setLocalScreeningParams((prev: any) => {
      const updatedSection = [...prev[sectionType]];
      updatedSection[index] = { ...updatedSection[index], checked: !updatedSection[index].checked };
      return { ...prev, [sectionType]: updatedSection };
    });
    setHasChanges(true);
  };

  const handleFlexibilityChange = (index: number, val: string) => {
    setLocalScreeningParams((prev: any) => {
      const updatedSection = [...prev[sectionType]];
      updatedSection[index] = { ...updatedSection[index], flexibility: val };
      return { ...prev, [sectionType]: updatedSection };
    });
    setHasChanges(true);
  };

  const handleResponseChange = (index: number, val: string) => {
    setLocalScreeningParams((prev: any) => {
      const updatedSection = [...prev[sectionType]];
      updatedSection[index] = { ...updatedSection[index], preferred_response: val };
      return { ...prev, [sectionType]: updatedSection };
    });
    setHasChanges(true);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ color: 'var(--color-cyan)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
      <div className="card-glass" style={{ padding: '8px 16px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: idx < items.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}>
            <input 
              type="checkbox" 
              checked={!!item.checked} 
              onChange={() => handleCheckboxChange(idx)}
              style={{ cursor: 'pointer', width: 15, height: 15 }}
            />
            <span style={{ minWidth: 150, fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>{item.parameter}</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Flexibility:</span>
              <select 
                value={item.flexibility || 'Preferred'} 
                onChange={(e) => handleFlexibilityChange(idx, e.target.value)}
                className="jd-score-select"
                style={{ padding: '2px 8px', borderRadius: 4, height: 26, fontSize: '0.78rem', minWidth: 100 }}
              >
                <option value="Select">Select</option>
                <option value="Preferred">Preferred</option>
                <option value="Mandatory">Mandatory</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Preferred Response:</span>
              <input 
                type="text" 
                value={item.preferred_response || ''} 
                onChange={(e) => handleResponseChange(idx, e.target.value)}
                className="jd-score-select"
                style={{ flex: 1, padding: '2px 8px', borderRadius: 4, height: 26, fontSize: '0.78rem' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenderFunctionalStructure({ 
  localFunctionalParams, 
  setLocalFunctionalParams, 
  setHasChanges 
}: { 
  localFunctionalParams: any; 
  setLocalFunctionalParams: React.Dispatch<React.SetStateAction<any>>;
  setHasChanges: (val: boolean) => void;
}) {
  const [activeCollapse, setActiveCollapse] = useState<number | null>(0);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicType, setNewTopicType] = useState('Theoretical');
  const [newTopicDiff, setNewTopicDiff] = useState('Medium');

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    setLocalFunctionalParams((prev: any) => ({
      ...prev,
      topics: [
        ...(prev.topics || []),
        {
          name: newTopicName.trim(),
          type: newTopicType,
          difficulty: newTopicDiff,
          questions: []
        }
      ]
    }));
    setNewTopicName('');
    setHasChanges(true);
    soundEngine.playChime([329.63, 392.00, 523.25], 0.1, 0.05);
  };

  const handleDeleteTopic = (index: number) => {
    setLocalFunctionalParams((prev: any) => ({
      ...prev,
      topics: prev.topics.filter((_: any, idx: number) => idx !== index)
    }));
    setHasChanges(true);
    if (activeCollapse === index) setActiveCollapse(null);
    soundEngine.playChime([523.25, 392.00, 329.63], 0.1, 0.05);
  };

  const handleAddQuestionToTopic = (topicIdx: number, qText: string) => {
    if (!qText.trim()) return;
    setLocalFunctionalParams((prev: any) => {
      const updatedTopics = [...prev.topics];
      updatedTopics[topicIdx] = {
        ...updatedTopics[topicIdx],
        questions: [...(updatedTopics[topicIdx].questions || []), qText.trim()]
      };
      return { ...prev, topics: updatedTopics };
    });
    setHasChanges(true);
    soundEngine.playChime([329.63, 523.25], 0.08, 0.04);
  };

  const handleDeleteQuestionFromTopic = (topicIdx: number, qIdx: number) => {
    setLocalFunctionalParams((prev: any) => {
      const updatedTopics = [...prev.topics];
      updatedTopics[topicIdx] = {
        ...updatedTopics[topicIdx],
        questions: updatedTopics[topicIdx].questions.filter((_: any, idx: number) => idx !== qIdx)
      };
      return { ...prev, topics: updatedTopics };
    });
    setHasChanges(true);
    soundEngine.playChime([523.25, 329.63], 0.08, 0.04);
  };

  return (
    <div>
      {/* Create Topic row */}
      <div className="card-glass" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-magenta)' }}>New Competency:</span>
        <input 
          type="text" 
          placeholder="e.g. Graph Theory Expertise" 
          value={newTopicName} 
          onChange={(e) => setNewTopicName(e.target.value)}
          className="jd-score-select"
          style={{ flex: 1, minWidth: 200, padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.85rem' }}
        />
        <select 
          value={newTopicType} 
          onChange={(e) => setNewTopicType(e.target.value)}
          className="jd-score-select"
          style={{ padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.8rem' }}
        >
          <option value="Theoretical">Theoretical</option>
          <option value="Experiential">Experiential</option>
        </select>
        <select 
          value={newTopicDiff} 
          onChange={(e) => setNewTopicDiff(e.target.value)}
          className="jd-score-select"
          style={{ padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.8rem' }}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button className="btn-jd-primary" onClick={handleAddTopic} style={{ height: 32, padding: '0 16px', fontSize: '0.8rem' }}>
          <Plus size={14} style={{ marginRight: 4 }} /> Add Topic
        </button>
      </div>

      {/* Topics collapsible pool */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(!localFunctionalParams?.topics || localFunctionalParams.topics.length === 0) ? (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 24, textAlign: 'center' }}>No functional topics generated.</p>
        ) : (
          localFunctionalParams.topics.map((topic: any, tIdx: number) => {
            const isExpanded = activeCollapse === tIdx;
            return (
              <div key={tIdx} className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setActiveCollapse(isExpanded ? null : tIdx)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }} />
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>{topic.name}</strong>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,0,127,0.1)', color: 'var(--color-magenta)', border: '1px solid rgba(255,0,127,0.2)', borderRadius: 4 }}>{topic.type}</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(0,245,255,0.1)', color: 'var(--color-cyan)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 4 }}>{topic.difficulty}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>({(topic.questions || []).length} Qs)</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(tIdx); }}
                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(topic.questions || []).map((q: string, qIdx: number) => (
                        <div key={qIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem' }}>
                          <span>{qIdx + 1}. {q}</span>
                          <button 
                            onClick={() => handleDeleteQuestionFromTopic(tIdx, qIdx)}
                            style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 2 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input 
                          type="text" 
                          placeholder="Add assessment question to this topic..." 
                          className="jd-score-select"
                          style={{ flex: 1, padding: '4px 8px', borderRadius: 4, height: 28, fontSize: '0.8rem' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddQuestionToTopic(tIdx, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button 
                          className="btn-jd-primary" 
                          style={{ padding: '0 12px', height: 28, fontSize: '0.75rem' }}
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            handleAddQuestionToTopic(tIdx, input.value);
                            input.value = '';
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { jobs, candidates, updateJobParameters } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'screening' | 'functional'>('overview');

  const job = jobs.find(j => j.id === jobId);

  // Sub-tabs for Recruiter and Functional stages
  const [screeningSubTab, setScreeningSubTab] = useState<'parameters' | 'candidates'>('parameters');
  const [functionalSubTab, setFunctionalSubTab] = useState<'structure' | 'candidates'>('structure');

  // Local parameter states for interactive editing before save
  const [localResumeParams, setLocalResumeParams] = useState<any>({ must_have: [], red_flags: [], good_to_have: [] });
  const [localScreeningParams, setLocalScreeningParams] = useState<any>({ experience: [], location: [], compensation: [] });
  const [localFunctionalParams, setLocalFunctionalParams] = useState<any>({ topics: [] });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize and sync parameter states when job is loaded or hasChanges resets, without overwriting active edits
  useEffect(() => {
    if (job && !hasChanges) {
      setLocalResumeParams(job.resumeParameters || { must_have: [], red_flags: [], good_to_have: [] });
      setLocalScreeningParams(job.screeningParameters || { experience: [], location: [], compensation: [] });
      setLocalFunctionalParams(job.functionalParameters || { topics: [] });
    }
  }, [job, hasChanges]);

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

  // Funnel Insights
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

  // Trigger save changes to DB
  const handleSaveParameters = async () => {
    setIsSaving(true);
    soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.15, 0.05);
    try {
      await updateJobParameters(job.id, {
        resumeParameters: localResumeParams,
        screeningParameters: localScreeningParams,
        functionalParameters: localFunctionalParams
      });
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetParameters = () => {
    soundEngine.playChime([392.00, 261.63], 0.1, 0.05);
    setLocalResumeParams(job.resumeParameters || { must_have: [], red_flags: [], good_to_have: [] });
    setLocalScreeningParams(job.screeningParameters || { experience: [], location: [], compensation: [] });
    setLocalFunctionalParams(job.functionalParameters || { topics: [] });
    setHasChanges(false);
  };

  return (
    <section className="dashboard-view active-view" id="view-job-detail" style={{ paddingBottom: hasChanges ? 80 : 24 }}>
      {/* Sub-nav tabs + back action */}
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

      {/* Tab Panes */}
      <div className="jd-panes">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="jd-pane active" id="jd-pane-overview">
            <div className="jd-overview-grid">
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

        {/* Resume Analysis Tab */}
        {activeTab === 'resume' && (
          <div className="jd-pane active" id="jd-pane-resume">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Award size={18} className="spark-gold" />
                <h3 className="type-h3" style={{ margin: 0 }}>Resume Matching Criteria</h3>
              </div>
              <p className="type-caption" style={{ marginBottom: 16 }}>Parameters automatically extracted from your job description. Resumes uploaded will be parsed and evaluated against these factors.</p>

              <RenderResumeList title="Must Have Parameters (Mandatory)" list={localResumeParams?.must_have || []} type="must_have" colorClass="bg-green" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />
              <RenderResumeList title="Should Not Have (Red Flags)" list={localResumeParams?.red_flags || []} type="red_flags" colorClass="bg-red" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />
              <RenderResumeList title="Good to Have Parameters" list={localResumeParams?.good_to_have || []} type="good_to_have" colorClass="bg-blue" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />
            </div>
          </div>
        )}

        {/* Recruiter Screening Tab */}
        {activeTab === 'screening' && (
          <div className="jd-pane active" id="jd-pane-screening">
            {/* Sub-tabs for Screening */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20, paddingBottom: 8 }}>
              <button 
                onClick={() => setScreeningSubTab('parameters')} 
                style={{ background: 'transparent', border: 'none', color: screeningSubTab === 'parameters' ? 'var(--color-cyan)' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', paddingBottom: 4, borderBottom: screeningSubTab === 'parameters' ? '2px solid var(--color-cyan)' : 'none' }}
              >
                Screening Parameters
              </button>
              <button 
                onClick={() => setScreeningSubTab('candidates')} 
                style={{ background: 'transparent', border: 'none', color: screeningSubTab === 'candidates' ? 'var(--color-cyan)' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', paddingBottom: 4, borderBottom: screeningSubTab === 'candidates' ? '2px solid var(--color-cyan)' : 'none' }}
              >
                Screening Candidates
              </button>
            </div>

            {screeningSubTab === 'parameters' ? (
              <div>
                <RenderScreeningSection title="Experience Verification" items={localScreeningParams?.experience || []} sectionType="experience" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
                <RenderScreeningSection title="Location Preference" items={localScreeningParams?.location || []} sectionType="location" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
                <RenderScreeningSection title="Compensation Boundaries" items={localScreeningParams?.compensation || []} sectionType="compensation" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* Functional Interview Tab */}
        {activeTab === 'functional' && (
          <div className="jd-pane active" id="jd-pane-functional">
            {/* Sub-tabs for Functional */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20, paddingBottom: 8 }}>
              <button 
                onClick={() => setFunctionalSubTab('structure')} 
                style={{ background: 'transparent', border: 'none', color: functionalSubTab === 'structure' ? 'var(--color-cyan)' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', paddingBottom: 4, borderBottom: functionalSubTab === 'structure' ? '2px solid var(--color-cyan)' : 'none' }}
              >
                Interview Structure
              </button>
              <button 
                onClick={() => setFunctionalSubTab('candidates')} 
                style={{ background: 'transparent', border: 'none', color: functionalSubTab === 'candidates' ? 'var(--color-cyan)' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', paddingBottom: 4, borderBottom: functionalSubTab === 'candidates' ? '2px solid var(--color-cyan)' : 'none' }}
              >
                Interview Candidates
              </button>
            </div>

            {functionalSubTab === 'structure' ? (
              <RenderFunctionalStructure localFunctionalParams={localFunctionalParams} setLocalFunctionalParams={setLocalFunctionalParams} setHasChanges={setHasChanges} />
            ) : (
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
            )}
          </div>
        )}
      </div>

      {/* Floating Action Row for Saving changes */}
      {hasChanges && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(2, 5, 15, 0.95)', borderTop: '1px solid rgba(0, 245, 255, 0.22)', padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', gap: 16, zIndex: 1000, backdropFilter: 'blur(20px)' }}>
          <button 
            className="btn-jd-ghost" 
            onClick={handleResetParameters}
            disabled={isSaving}
          >
            Reset
          </button>
          <button 
            className="btn-jd-primary" 
            onClick={handleSaveParameters}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {isSaving ? 'Saving...' : (
              <>
                <Check size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
