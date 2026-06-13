'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import {
  Filter, Search, Users, Calendar, BarChart3, Info, Sparkles, Check, X,
  Plus, Trash2, ChevronDown, Award, ArrowRight, Copy, CheckCircle2,
  ChevronRight, TrendingUp, AlertCircle, RefreshCw, Zap, Brain, Lightbulb
} from 'lucide-react';
import { soundEngine } from '@/components/SoundEngine';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── EXTRACTED SUB-COMPONENTS ───────────────────────────────────────────────

function RenderResumeList({
  title, list, type, colorClass, setLocalResumeParams, setHasChanges
}: {
  title: string; list: string[]; type: 'must_have' | 'red_flags' | 'good_to_have';
  colorClass: string;
  setLocalResumeParams: React.Dispatch<React.SetStateAction<any>>;
  setHasChanges: (val: boolean) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    setLocalResumeParams((prev: any) => ({ ...prev, [type]: [...(prev[type] || []), newItem.trim()] }));
    setNewItem('');
    setHasChanges(true);
    soundEngine.playChime([329.63, 392.00], 0.08, 0.04);
  };

  const handleDelete = (index: number) => {
    setLocalResumeParams((prev: any) => ({ ...prev, [type]: prev[type].filter((_: any, idx: number) => idx !== index) }));
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
              <button onClick={() => handleDelete(idx)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 2 }}>
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
  title, items, sectionType, setLocalScreeningParams, setHasChanges
}: {
  title: string; items: any[]; sectionType: 'experience' | 'location' | 'compensation';
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
      <h4 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
      <div className="card-glass" style={{ padding: '8px 16px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: idx < items.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}>
            <input type="checkbox" checked={!!item.checked} onChange={() => handleCheckboxChange(idx)} style={{ cursor: 'pointer', width: 15, height: 15 }} />
            <span style={{ minWidth: 150, fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>{item.parameter}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Flexibility:</span>
              <select value={item.flexibility || 'Preferred'} onChange={(e) => handleFlexibilityChange(idx, e.target.value)} className="jd-score-select" style={{ padding: '2px 8px', borderRadius: 4, height: 26, fontSize: '0.78rem', minWidth: 100 }}>
                <option value="Select">Select</option>
                <option value="Preferred">Preferred</option>
                <option value="Mandatory">Mandatory</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Preferred Response:</span>
              <input type="text" value={item.preferred_response || ''} onChange={(e) => handleResponseChange(idx, e.target.value)} className="jd-score-select" style={{ flex: 1, padding: '2px 8px', borderRadius: 4, height: 26, fontSize: '0.78rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenderFunctionalStructure({
  localFunctionalParams, setLocalFunctionalParams, setHasChanges
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
      topics: [...(prev.topics || []), { name: newTopicName.trim(), type: newTopicType, difficulty: newTopicDiff, questions: [] }]
    }));
    setNewTopicName('');
    setHasChanges(true);
    soundEngine.playChime([329.63, 392.00, 523.25], 0.1, 0.05);
  };

  const handleDeleteTopic = (index: number) => {
    setLocalFunctionalParams((prev: any) => ({ ...prev, topics: prev.topics.filter((_: any, idx: number) => idx !== index) }));
    setHasChanges(true);
    if (activeCollapse === index) setActiveCollapse(null);
  };

  const handleAddQuestionToTopic = (topicIdx: number, qText: string) => {
    if (!qText.trim()) return;
    setLocalFunctionalParams((prev: any) => {
      const updatedTopics = [...prev.topics];
      updatedTopics[topicIdx] = { ...updatedTopics[topicIdx], questions: [...(updatedTopics[topicIdx].questions || []), qText.trim()] };
      return { ...prev, topics: updatedTopics };
    });
    setHasChanges(true);
  };

  const handleDeleteQuestionFromTopic = (topicIdx: number, qIdx: number) => {
    setLocalFunctionalParams((prev: any) => {
      const updatedTopics = [...prev.topics];
      updatedTopics[topicIdx] = { ...updatedTopics[topicIdx], questions: updatedTopics[topicIdx].questions.filter((_: any, idx: number) => idx !== qIdx) };
      return { ...prev, topics: updatedTopics };
    });
    setHasChanges(true);
  };

  return (
    <div>
      <div className="card-glass" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-indigo)' }}>New Competency:</span>
        <input type="text" placeholder="e.g. Graph Theory Expertise" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="jd-score-select" style={{ flex: 1, minWidth: 200, padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.85rem' }} />
        <select value={newTopicType} onChange={(e) => setNewTopicType(e.target.value)} className="jd-score-select" style={{ padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.8rem' }}>
          <option value="Theoretical">Theoretical</option>
          <option value="Experiential">Experiential</option>
        </select>
        <select value={newTopicDiff} onChange={(e) => setNewTopicDiff(e.target.value)} className="jd-score-select" style={{ padding: '4px 8px', borderRadius: 4, height: 32, fontSize: '0.8rem' }}>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button className="btn-jd-primary" onClick={handleAddTopic} style={{ height: 32, padding: '0 16px', fontSize: '0.8rem' }}>
          <Plus size={14} style={{ marginRight: 4 }} /> Add Topic
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(!localFunctionalParams?.topics || localFunctionalParams.topics.length === 0) ? (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 24, textAlign: 'center' }}>No functional topics generated.</p>
        ) : (
          localFunctionalParams.topics.map((topic: any, tIdx: number) => {
            const isExpanded = activeCollapse === tIdx;
            return (
              <div key={tIdx} className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setActiveCollapse(isExpanded ? null : tIdx)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }} />
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>{topic.name}</strong>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(var(--color-indigo-rgb),0.12)', color: 'var(--color-indigo)', border: '1px solid rgba(var(--color-indigo-rgb),0.25)', borderRadius: 4 }}>{topic.type}</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(var(--color-gold-rgb),0.12)', color: 'var(--color-gold)', border: '1px solid rgba(var(--color-gold-rgb),0.25)', borderRadius: 4 }}>{topic.difficulty}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>({(topic.questions || []).length} Qs)</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(tIdx); }} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(topic.questions || []).map((q: string, qIdx: number) => (
                        <div key={qIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem' }}>
                          <span>{qIdx + 1}. {q}</span>
                          <button onClick={() => handleDeleteQuestionFromTopic(tIdx, qIdx)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 2 }}>
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
                        <button className="btn-jd-primary" style={{ padding: '0 12px', height: 28, fontSize: '0.75rem' }}
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            handleAddQuestionToTopic(tIdx, input.value);
                            input.value = '';
                          }}>Add</button>
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

// ─── VISUAL FUNNEL CHART ─────────────────────────────────────────────────────

// ─── VISUAL FUNNEL CHART ─────────────────────────────────────────────────────

function FunnelChart({ stages }: { stages: any[] }) {
  const W = 600, H = 450;
  const cx = 430; // Centered on the right half of the chart box
  const maxHW = 110;
  const padT = 30, padB = 30;

  const total = Math.max(stages[0]?.count || 0, 1);
  const n = stages.length;
  const ys = stages.map((_, i) => padT + (i / (n - 1)) * (H - padT - padB));

  const hws = stages.map((s, i) => {
    const count = s.count || 0;
    const frac = count / total;
    // Taper decay to keep funnel shape consistent
    const maxAllowed = i === 0 ? maxHW : 110 - i * 16;
    return Math.max(Math.min(frac * maxHW, maxAllowed), 10);
  });

  const pts = stages.map((_, i) => ({
    y: ys[i],
    lx: cx - hws[i],
    rx: cx + hws[i],
  }));

  const segments: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const midY = (p.y + q.y) / 2;

    segments.push(
      `M ${p.lx} ${p.y} L ${p.rx} ${p.y}` +
      ` C ${p.rx} ${midY} ${q.rx} ${midY} ${q.rx} ${q.y}` +
      ` L ${q.lx} ${q.y}` +
      ` C ${q.lx} ${midY} ${p.lx} ${midY} ${p.lx} ${p.y} Z`
    );
  }

  const stageColors = [
    'var(--color-text)',
    '#60a5fa', // Resume
    '#f59e0b', // Screening
    '#34d099', // Functional
    '#a855f7', // Completed
    '#ec4899'  // Qualified
  ];

  return (
    <svg id="jd-funnel-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Stage 0 -> 1: Silver to Blue */}
        <linearGradient id="grad-stage-0" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.75"/>
        </linearGradient>
        {/* Stage 1 -> 2: Blue to Orange */}
        <linearGradient id="grad-stage-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.75"/>
        </linearGradient>
        {/* Stage 2 -> 3: Orange to Green */}
        <linearGradient id="grad-stage-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#34d099" stopOpacity="0.75"/>
        </linearGradient>
        {/* Stage 3 -> 4: Green to Purple */}
        <linearGradient id="grad-stage-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d099" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.75"/>
        </linearGradient>
        {/* Stage 4 -> 5: Purple to Pink */}
        <linearGradient id="grad-stage-4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.75"/>
        </linearGradient>
      </defs>

      {/* Render dotted lines across the chart area behind the funnel */}
      {ys.map((y, idx) => (
        <line
          key={`line-${idx}`}
          x1={20}
          y1={y}
          x2={560}
          y2={y}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      ))}

      {/* Render horizontal stages */}
      {segments.map((d, i) => (
        <path key={`seg-${i}`} d={d} fill={`url(#grad-stage-${i})`} />
      ))}

      {/* Render labels and counts on the left aligned vertically with stage dotted lines */}
      {stages.map((stage, idx) => {
        const y = ys[idx];
        const color = stageColors[idx];

        return (
          <g key={idx}>
            {/* Stage Numeric Value */}
            <text
              x={20}
              y={y - 12}
              fill="var(--color-text)"
              fontSize="24"
              fontWeight="800"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {stage.count}
            </text>

            {/* Stage Label */}
            <text
              x={20}
              y={y + 6}
              fill="var(--color-text-muted)"
              fontSize="12"
              fontWeight="600"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {stage.label}
            </text>

            {/* Conversion Subtext */}
            {stage.conversion !== null && (
              <text
                x={20}
                y={y + 20}
                fill={color}
                fontSize="10"
                fontWeight="700"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.02em' }}
              >
                {stage.conversion}% conversion
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SCORE BAR CHART ─────────────────────────────────────────────────────────

function ScoreDistributionChart({ distribution }: { distribution: Record<string, number> }) {
  const values = Object.values(distribution);
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  const maxVal = Math.max(...values, 1);
  const buckets = Object.entries(distribution);
  const barGradient = 'linear-gradient(180deg, var(--color-gold) 0%, rgba(181, 154, 87, 0.35) 100%)';

  return (
    <div style={{ position: 'relative', height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0 0 40px' }}>
      {/* Grid Lines */}
      <div style={{ position: 'absolute', left: 40, right: 0, top: 10, bottom: 35, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {[100, 75, 50, 25, 0].map((level) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', width: '100%', height: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: -35, fontSize: '0.65rem', color: 'var(--color-text-faint)', width: 30, textAlign: 'right', fontWeight: 600 }}>{level}%</span>
            <div style={{ flex: 1, borderBottom: '1px dashed rgba(255, 255, 255, 0.08)' }} />
          </div>
        ))}
      </div>

      {/* Bars */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'flex-end', gap: 16, margin: '0 10px 25px 10px', height: '100%' }}>
        {buckets.map(([label, val]) => {
          const pct = Math.round((val / total) * 100);
          const barHeight = total > 0 ? (val / maxVal) * 100 : 0;

          return (
            <div key={label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
              {val > 0 && (
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text)', fontWeight: 700, marginBottom: 4 }}>{val} ({pct}%)</span>
              )}
              <div style={{
                width: '100%',
                maxWidth: 32,
                height: `${Math.max(barHeight, val > 0 ? 5 : 2)}%`,
                background: val > 0 ? barGradient : 'rgba(255, 255, 255, 0.02)',
                border: val > 0 ? '1px solid rgba(var(--color-gold-rgb), 0.25)' : '1px dashed rgba(255, 255, 255, 0.04)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                boxShadow: val > 0 ? '0 4px 12px rgba(var(--color-gold-rgb), 0.06)' : 'none',
              }}
              title={`${val} candidates (${pct}%) in ${label} range`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', paddingLeft: 10, paddingRight: 10, marginBottom: 5 }}>
        {buckets.map(([label]) => (
          <span key={label} style={{ flex: 1, fontSize: '0.68rem', color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 600 }}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── CANDIDATE TABLE ──────────────────────────────────────────────────────────

function CandidateTable({
  candidates, stage, onAdvance, onCopyLink
}: {
  candidates: any[];
  stage: 'resume' | 'screening' | 'functional';
  onAdvance: (id: string) => void;
  onCopyLink: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (score: string) => {
    const n = parseInt(score);
    if (isNaN(n)) return 'var(--color-text-muted)';
    if (n >= 75) return '#22c55e';
    if (n >= 50) return 'var(--color-gold)';
    return '#ef4444';
  };

  const nextStageLabel = stage === 'resume' ? 'Move to Screening' : stage === 'screening' ? 'Move to Functional' : 'Mark Complete';

  if (candidates.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Users size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ fontSize: '0.9rem' }}>No candidates at this stage yet.</p>
        <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Add candidates via the Sourcing page.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search candidates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="jd-score-select"
          style={{ width: '100%', paddingLeft: 36, height: 36, borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      <div className="data-table" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Candidate</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Email</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Score</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Status</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(var(--color-gold-rgb),0.15)', border: '1px solid rgba(var(--color-gold-rgb),0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)', flexShrink: 0 }}>
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    {c.name}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{c.email}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: scoreColor(c.score), fontSize: '0.95rem' }}>{c.score || '—'}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: c.status === 'Functional' ? 'rgba(139,92,246,0.15)' : c.status === 'Screening' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                    color: c.status === 'Functional' ? 'var(--color-gold)' : c.status === 'Screening' ? 'var(--color-indigo)' : 'var(--color-text-muted)',
                    border: `1px solid ${c.status === 'Functional' ? 'rgba(139,92,246,0.3)' : c.status === 'Screening' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>{c.status}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onCopyLink(c.id)}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Copy Interview Link"
                    >
                      <Copy size={11} /> Link
                    </button>
                    <button
                      onClick={() => onAdvance(c.id)}
                      style={{ background: 'rgba(var(--color-gold-rgb),0.12)', border: '1px solid rgba(var(--color-gold-rgb),0.3)', color: 'var(--color-gold)', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <ArrowRight size={11} /> {nextStageLabel}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RESUME ANALYSIS RESULT CARD ──────────────────────────────────────────────

function ResumeAnalysisResult({ results }: { results: any[] }) {
  const shortlisted = results.filter(r => r.shortlisted);
  const rejected = results.filter(r => !r.shortlisted);

  const scoreColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 55) return 'var(--color-gold)';
    return '#ef4444';
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="card-glass" style={{ flex: 1, padding: '14px 20px', textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>{shortlisted.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Shortlisted</div>
        </div>
        <div className="card-glass" style={{ flex: 1, padding: '14px 20px', textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{rejected.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Not Shortlisted</div>
        </div>
        <div className="card-glass" style={{ flex: 1, padding: '14px 20px', textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-gold)' }}>
            {results.length > 0 ? Math.round(results.reduce((s, r) => s + r.resume_score, 0) / results.length) : 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Avg Score</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((r, i) => (
          <div key={i} className="card-glass" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(var(--color-gold-rgb),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-gold)', flexShrink: 0 }}>
                {r.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{r.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{r.reason}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor(r.resume_score) }}>{r.resume_score}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Score</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                background: r.shortlisted ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: r.shortlisted ? '#22c55e' : '#ef4444',
                border: `1px solid ${r.shortlisted ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {r.shortlisted ? '✓ Shortlisted' : '✗ Not Shortlisted'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { jobs, candidates, updateJobParameters, advanceCandidate, isDataLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'screening' | 'functional'>('overview');

  const job = jobs.find(j => j.id === jobId);

  // Sub-tabs
  const [screeningSubTab, setScreeningSubTab] = useState<'parameters' | 'candidates'>('parameters');
  const [functionalSubTab, setFunctionalSubTab] = useState<'structure' | 'candidates'>('structure');

  // Parameter editing
  const [localResumeParams, setLocalResumeParams] = useState<any>({ must_have: [], red_flags: [], good_to_have: [] });
  const [localScreeningParams, setLocalScreeningParams] = useState<any>({ experience: [], location: [], compensation: [] });
  const [localFunctionalParams, setLocalFunctionalParams] = useState<any>({ topics: [] });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Score distribution selector state
  const [scoreType, setScoreType] = useState<'interview' | 'screening' | 'resume'>('interview');

  // Live funnel from API
  const [liveFunnel, setLiveFunnel] = useState<any>(null);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(false);

  // AI Resume Analysis
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);

  // Interview link copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Init param states
  useEffect(() => {
    if (job && !hasChanges) {
      setLocalResumeParams(job.resumeParameters || { must_have: [], red_flags: [], good_to_have: [] });
      setLocalScreeningParams(job.screeningParameters || { experience: [], location: [], compensation: [] });
      setLocalFunctionalParams(job.functionalParameters || { topics: [] });
    }
  }, [job, hasChanges]);

  // Fetch live funnel on overview tab
  const fetchLiveFunnel = useCallback(async () => {
    if (!jobId) return;
    setIsLoadingFunnel(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/responses?tab=overview`);
      if (res.ok) {
        const data = await res.json();
        setLiveFunnel(data);
      }
    } catch (err) {
      console.error('Failed to fetch funnel:', err);
    } finally {
      setIsLoadingFunnel(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchLiveFunnel();
    }
  }, [activeTab, fetchLiveFunnel]);

  const jobCandidates = useMemo(() => {
    if (!job) return [];
    return candidates.filter(c => c.jobApplied === job.roleName || c.jobApplied === job.cardName);
  }, [job, candidates]);

  // scoreDistribution must be declared before any early return (Rules of Hooks)
  const scoreDistribution = useMemo(() => {
    const dist: Record<string, number> = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    if (!job) return dist;

    if (scoreType === 'interview') {
      if (liveFunnel?.score_distribution) {
        return liveFunnel.score_distribution;
      }
      jobCandidates.forEach(c => {
        if (c.status === 'Functional' || c.status === 'Hired') {
          const s = parseInt(c.score);
          if (!isNaN(s)) {
            if (s <= 20) dist['0-20']++;
            else if (s <= 40) dist['20-40']++;
            else if (s <= 60) dist['40-60']++;
            else if (s <= 80) dist['60-80']++;
            else dist['80-100']++;
          }
        }
      });
    } else if (scoreType === 'screening') {
      jobCandidates.forEach(c => {
        if (c.status === 'Screening') {
          const s = parseInt(c.score);
          if (!isNaN(s)) {
            if (s <= 20) dist['0-20']++;
            else if (s <= 40) dist['20-40']++;
            else if (s <= 60) dist['40-60']++;
            else if (s <= 80) dist['60-80']++;
            else dist['80-100']++;
          }
        }
      });
    } else {
      jobCandidates.forEach(c => {
        if (c.status === 'Resume') {
          const s = parseInt(c.score);
          if (!isNaN(s)) {
            if (s <= 20) dist['0-20']++;
            else if (s <= 40) dist['20-40']++;
            else if (s <= 60) dist['40-60']++;
            else if (s <= 80) dist['60-80']++;
            else dist['80-100']++;
          }
        }
      });
    }
    return dist;
  }, [scoreType, liveFunnel, jobCandidates, job]);

  if (!job) {
    // Still loading data from API — show skeleton instead of "not found"
    if (isDataLoading) {
      return (
        <section className="dashboard-view active-view">
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
            <div style={{ height: 36, width: '40%', borderRadius: 8, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ height: 20, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite 0.1s' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 12 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ height: 90, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: `shimmer 1.5s infinite ${i*0.1}s` }} />
              ))}
            </div>
            <div style={{ height: 320, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite 0.3s' }} />
          </div>
          <style>{`
            @keyframes shimmer {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
          `}</style>
        </section>
      );
    }
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

  // Build funnel stages from live data or fallback to local
  const funnelStages = liveFunnel?.stages || [
    { label: 'Total Candidates', count: job.pipeline.total, conversion: null },
    { label: 'Resume Analysis', count: job.pipeline.resume, conversion: job.pipeline.total > 0 ? Math.round((job.pipeline.resume / job.pipeline.total) * 100) : 0 },
    { label: 'Recruiter Screening', count: job.pipeline.screening, conversion: job.pipeline.total > 0 ? Math.round((job.pipeline.screening / job.pipeline.total) * 100) : 0 },
    { label: 'Functional Interview', count: job.pipeline.functional, conversion: job.pipeline.screening > 0 ? Math.round((job.pipeline.functional / job.pipeline.screening) * 100) : 0 },
    { label: 'Completed', count: 0, conversion: 0 },
    { label: 'Qualified', count: 0, conversion: 0 },
  ];

  // Insights
  const insights: Array<{ type: string; text: string }> = [];
  const totalCount = funnelStages[0]?.count || 0;
  if (totalCount === 0) {
    insights.push({ type: 'info', text: 'No candidates yet. Use the Sourcing page to add applicants.' });
  } else {
    const resumeCount = funnelStages[1]?.count || 0;
    const screeningCount = funnelStages[2]?.count || 0;
    if (resumeCount === 0) insights.push({ type: 'warn', text: 'Resume Analysis stage has 0 candidates — upload resumes in the Sourcing page.' });
    if (screeningCount > 0 && totalCount > 0) {
      const pct = Math.round((screeningCount / totalCount) * 100);
      if (pct >= 40) insights.push({ type: 'good', text: `Strong ${pct}% conversion to Recruiter Screening.` });
    }
    const funcCount = funnelStages[3]?.count || 0;
    if (funcCount > 0) insights.push({ type: 'good', text: `${funcCount} candidate${funcCount > 1 ? 's' : ''} reached Functional Interview.` });
  }
  if (insights.length === 0) insights.push({ type: 'info', text: 'Funnel data looks healthy. Continue monitoring progress.' });

  const screeningCandidates = jobCandidates.filter(c => c.status === 'Screening' || c.status === 'Functional' || c.status === 'Hired');
  const functionalCandidates = jobCandidates.filter(c => c.status === 'Functional' || c.status === 'Hired');

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

  const handleRunAIAnalysis = async () => {
    setIsAnalysing(true);
    setAnalysisResults(null);
    soundEngine.playChime([392.00, 523.25, 659.25], 0.12, 0.06);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${job.id}/applicants/analyse-resumes`, { method: 'POST' });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysisResults(data.results || []);
      setAnalysisDone(true);
      soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);
    } catch (err) {
      alert('AI analysis failed. Please check if backend is running.');
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleAdvanceCandidate = async (candidateId: string) => {
    soundEngine.playChime([329.63, 523.25], 0.1, 0.05);
    await advanceCandidate(candidateId);
  };

  const handleCopyLink = (candidateId: string) => {
    const link = `${window.location.origin}/apply/${job.id}?candidate=${candidateId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(candidateId);
      soundEngine.playChime([523.25, 659.25], 0.1, 0.04);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyJobLink = () => {
    const link = `${window.location.origin}/apply/${job.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId('job');
      soundEngine.playChime([523.25, 659.25], 0.1, 0.04);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const accentStyle: React.CSSProperties = { color: 'var(--color-gold)', borderBottomColor: 'var(--color-gold)' };
  const mutedStyle: React.CSSProperties = { color: 'var(--color-text-muted)' };

  return (
    <section className="dashboard-view active-view" id="view-job-detail" style={{ paddingBottom: hasChanges ? 80 : 24 }}>

      {/* Sub-nav */}
      <div className="jd-subnav">
        <div className="jd-tabs">
          {(['overview', 'resume', 'screening', 'functional'] as const).map(tab => (
            <button key={tab} className={`jd-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && 'Overview'}
              {tab === 'resume' && <><Award size={13} style={{ marginRight: 5 }} />Resume Analysis</>}
              {tab === 'screening' && <><><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></> Recruiter Screening <span className="jd-count-pill">{job.pipeline.screening}</span></>}
              {tab === 'functional' && <><><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg></> Functional Interview <span className="jd-count-pill">{job.pipeline.functional}</span></>}
            </button>
          ))}
        </div>
        <div className="jd-actions">
          <button className="btn-jd-ghost" onClick={handleCopyJobLink} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {copiedId === 'job' ? <CheckCircle2 size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
            {copiedId === 'job' ? 'Copied!' : 'Copy Interview Link'}
          </button>
          <button className="btn-jd-ghost" onClick={() => router.push('/jobs')}>← Back to Jobs</button>
          <button className="btn-jd-primary" onClick={() => router.push(`/jobs/${job.id}/sourcing`)}>+ Add Applicants</button>
        </div>
      </div>

      {/* Tab Panes */}
      <div className="jd-panes">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="jd-pane active" id="jd-pane-overview">
            <div className="jd-overview-grid">
              <div className="card-glass jd-funnel-card">
                <div className="jd-panel-header">
                  <Filter size={15} stroke="var(--color-gold)" />
                  <h3 className="jd-card-title">Candidate Funnel</h3>
                  <button onClick={fetchLiveFunnel} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                    <RefreshCw size={12} style={{ animation: isLoadingFunnel ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                  </button>
                </div>
                <div className="jd-funnel-body" style={{ minHeight: '380px', display: 'flex', alignItems: 'center' }}>
                  <div className="jd-funnel-chart-wrap" style={{ width: '100%', flex: 1 }}>
                    <FunnelChart stages={funnelStages} />
                  </div>
                </div>
                <div className="jd-funnel-legend" style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 12 }}>
                  <div className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}><span className="jd-ldot" style={{ background: '#6366f1', width: 8, height: 8, borderRadius: '50%' }} />Career Page</div>
                  <div className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}><span className="jd-ldot" style={{ background: '#06b6d4', width: 8, height: 8, borderRadius: '50%' }} />ATS</div>
                  <div className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}><span className="jd-ldot" style={{ background: '#f59e0b', width: 8, height: 8, borderRadius: '50%' }} />Bulk Upload</div>
                  <div className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}><span className="jd-ldot" style={{ background: '#ec4899', width: 8, height: 8, borderRadius: '50%' }} />Scheduled</div>
                  <div className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}><span className="jd-ldot" style={{ background: '#10b981', width: 8, height: 8, borderRadius: '50%' }} />Direct Link</div>
                </div>
              </div>

              <div className="jd-right-panels" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card-glass jd-insights-card">
                  <div className="jd-panel-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Lightbulb size={15} stroke="var(--color-gold)" />
                    <h3 className="jd-card-title">Funnel Insights</h3>
                    <span className="jd-badge-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: 12, fontSize: '0.65rem', fontWeight: 600, marginLeft: 8 }}>Recommendations</span>
                  </div>
                  <div className="jd-insights-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {insights.map((ins, i) => {
                      let recommendation = "Follow-up with candidate to improve completion rate";
                      if (ins.type === 'warn' || ins.text.includes('0 candidates')) {
                        recommendation = "Upload candidate resumes in the sourcing pane to begin analysis.";
                      } else if (ins.type === 'info' && totalCount === 0) {
                        recommendation = "Share the direct application link or upload candidate list.";
                      } else if (ins.type === 'good') {
                        recommendation = "Continue scheduling next round vetting for remaining candidates.";
                      }

                      return (
                        <div key={i} className="jd-insight-container" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12, padding: 16 }}>
                          <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 12 }}>{ins.text}</p>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle2 size={14} style={{ color: 'var(--color-gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended action</span>
                              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{recommendation}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card-glass jd-score-card">
                  <div className="jd-score-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div className="jd-score-title-row" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BarChart3 size={15} />
                      <h3 className="jd-card-title">Score Distribution</h3>
                    </div>
                    <select
                      value={scoreType}
                      onChange={(e) => setScoreType(e.target.value as any)}
                      className="jd-score-select"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--color-text)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="interview">Interview Score</option>
                      <option value="screening">Screening Score</option>
                      <option value="resume">Resume Score</option>
                    </select>
                  </div>
                  <div className="jd-score-chart-wrap" style={{ marginTop: 12 }}>
                    <ScoreDistributionChart distribution={scoreDistribution} />
                  </div>
                  <div className="jd-score-legend" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                    <span className="jd-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      <span className="jd-ldot" style={{ background: 'var(--color-gold)', width: 6, height: 6, borderRadius: '50%' }} /> Percentage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESUME ANALYSIS ── */}
        {activeTab === 'resume' && (
          <div className="jd-pane active" id="jd-pane-resume">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} className="spark-gold" />
                  <h3 className="type-h3" style={{ margin: 0 }}>Resume Matching Criteria</h3>
                </div>
                <button
                  className="btn-action"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalysing}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}
                >
                  {isAnalysing ? (
                    <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running AI Analysis...</>
                  ) : (
                    <><Brain size={14} /> Run AI Resume Shortlisting</>
                  )}
                </button>
              </div>
              <p className="type-caption" style={{ marginBottom: 4 }}>
                Parameters auto-extracted from your JD. Click "Run AI Resume Shortlisting" to score all candidates using Groq LLM.
              </p>

              <RenderResumeList title="Must Have Parameters (Mandatory)" list={localResumeParams?.must_have || []} type="must_have" colorClass="bg-green" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />
              <RenderResumeList title="Should Not Have (Red Flags)" list={localResumeParams?.red_flags || []} type="red_flags" colorClass="bg-red" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />
              <RenderResumeList title="Good to Have Parameters" list={localResumeParams?.good_to_have || []} type="good_to_have" colorClass="bg-blue" setLocalResumeParams={setLocalResumeParams} setHasChanges={setHasChanges} />

              {/* AI Analysis Results */}
              {isAnalysing && (
                <div className="card-glass" style={{ padding: 32, textAlign: 'center' }}>
                  <Brain size={36} style={{ color: 'var(--color-gold)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                  <h4 style={{ margin: '0 0 8px', color: 'var(--color-text)' }}>Avya AI Analysing Resumes...</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Scoring each candidate against your resume criteria using Groq LLM</p>
                </div>
              )}
              {analysisResults && analysisResults.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} style={{ color: '#22c55e' }} /> AI Analysis Complete
                  </h4>
                  <ResumeAnalysisResult results={analysisResults} />
                </div>
              )}
              {analysisDone && analysisResults?.length === 0 && (
                <div className="card-glass" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No applicants found for this job yet. Add candidates via the Sourcing page.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RECRUITER SCREENING ── */}
        {activeTab === 'screening' && (
          <div className="jd-pane active" id="jd-pane-screening">
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20, paddingBottom: 8 }}>
              {(['parameters', 'candidates'] as const).map(sub => (
                <button key={sub} onClick={() => setScreeningSubTab(sub)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: 4, fontSize: '0.85rem', fontWeight: 600, ...(screeningSubTab === sub ? accentStyle : mutedStyle), borderBottom: screeningSubTab === sub ? '2px solid var(--color-gold)' : 'none' }}>
                  {sub === 'parameters' ? 'Screening Parameters' : `Screening Candidates (${screeningCandidates.length})`}
                </button>
              ))}
            </div>
            {screeningSubTab === 'parameters' ? (
              <div>
                <RenderScreeningSection title="Experience Verification" items={localScreeningParams?.experience || []} sectionType="experience" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
                <RenderScreeningSection title="Location Preference" items={localScreeningParams?.location || []} sectionType="location" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
                <RenderScreeningSection title="Compensation Boundaries" items={localScreeningParams?.compensation || []} sectionType="compensation" setLocalScreeningParams={setLocalScreeningParams} setHasChanges={setHasChanges} />
              </div>
            ) : (
              <CandidateTable
                candidates={screeningCandidates}
                stage="screening"
                onAdvance={handleAdvanceCandidate}
                onCopyLink={handleCopyLink}
              />
            )}
          </div>
        )}

        {/* ── FUNCTIONAL INTERVIEW ── */}
        {activeTab === 'functional' && (
          <div className="jd-pane active" id="jd-pane-functional">
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20, paddingBottom: 8 }}>
              {(['structure', 'candidates'] as const).map(sub => (
                <button key={sub} onClick={() => setFunctionalSubTab(sub)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: 4, fontSize: '0.85rem', fontWeight: 600, ...(functionalSubTab === sub ? accentStyle : mutedStyle), borderBottom: functionalSubTab === sub ? '2px solid var(--color-gold)' : 'none' }}>
                  {sub === 'structure' ? 'Interview Structure' : `Interview Candidates (${functionalCandidates.length})`}
                </button>
              ))}
            </div>
            {functionalSubTab === 'structure' ? (
              <RenderFunctionalStructure localFunctionalParams={localFunctionalParams} setLocalFunctionalParams={setLocalFunctionalParams} setHasChanges={setHasChanges} />
            ) : (
              <CandidateTable
                candidates={functionalCandidates}
                stage="functional"
                onAdvance={handleAdvanceCandidate}
                onCopyLink={handleCopyLink}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(5, 5, 8, 0.96)', borderTop: '1px solid rgba(var(--color-gold-rgb), 0.28)', padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', gap: 16, zIndex: 1000, backdropFilter: 'blur(24px)' }}>
          <button className="btn-jd-ghost" onClick={handleResetParameters} disabled={isSaving}>Reset</button>
          <button className="btn-jd-primary" onClick={handleSaveParameters} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSaving ? 'Saving...' : <><Check size={14} /> Save Changes</>}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </section>
  );
}
