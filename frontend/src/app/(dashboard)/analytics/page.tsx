'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { soundEngine } from '@/components/SoundEngine';
import {
  Users,
  FileText,
  Video,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { jobs, candidates, openReport } = useAppContext();
  const [subtab, setSubtab] = useState<'jobs-data' | 'candidates-data'>('jobs-data');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state for jobs table
  const [jobsSortKey, setJobsSortKey] = useState<'id' | 'role' | 'card'>('id');
  const [jobsSortAsc, setJobsSortAsc] = useState(true);

  // 1. Calculate Summary Metrics
  const summary = useMemo(() => {
    let totalApplicants = 0;
    let resumeCount = 0;
    let screeningCount = 0;
    let functionalCount = 0;

    jobs.forEach((job) => {
      totalApplicants += job.pipeline.total || 0;
      resumeCount += job.pipeline.resume || 0;
      screeningCount += job.pipeline.screening || 0;
      functionalCount += job.pipeline.functional || 0;
    });

    return {
      totalApplicants,
      resumeCount,
      screeningCount,
      functionalCount,
    };
  }, [jobs]);

  // 2. Filter & Sort Jobs Table
  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.roleName.toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q) ||
          j.cardName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a.id;
      let valB = b.id;
      if (jobsSortKey === 'role') {
        valA = a.roleName;
        valB = b.roleName;
      } else if (jobsSortKey === 'card') {
        valA = a.cardName;
        valB = b.cardName;
      }
      return jobsSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return list;
  }, [jobs, searchQuery, jobsSortKey, jobsSortAsc]);

  // 3. Filter Candidates Table
  const filteredCandidates = useMemo(() => {
    let list = [...candidates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.jobApplied.toLowerCase().includes(q)
      );
    }
    return list;
  }, [candidates, searchQuery]);

  // Handle column config placeholder click
  const handleColumnConfig = () => {
    soundEngine.playClick();
    alert('Column configuration interface details can be linked to your role custom database.');
  };

  // Export CSV
  const handleExport = () => {
    soundEngine.playChime([523.25, 659.25, 783.99], 0.2, 0.08);

    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'export.csv';

    if (subtab === 'jobs-data') {
      csvContent += 'Job ID,Role Name,Card Name,Experience Band,Created By\n';
      jobs.forEach((j) => {
        csvContent += `"${j.id}","${j.roleName}","${j.cardName}","${j.experienceBand}","${j.createdBy}"\n`;
      });
      filename = 'interviehire_jobs_export.csv';
    } else {
      csvContent += 'Candidate ID,Name,Email,Job Applied,Status,Score,Registered On\n';
      candidates.forEach((c) => {
        csvContent += `"${c.id}","${c.name}","${c.email}","${c.jobApplied}","${c.status}","${c.score}","${c.registeredOn}"\n`;
      });
      filename = 'interviehire_candidates_export.csv';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (key: 'id' | 'role' | 'card') => {
    soundEngine.playClick();
    if (jobsSortKey === key) {
      setJobsSortAsc(!jobsSortAsc);
    } else {
      setJobsSortKey(key);
      setJobsSortAsc(true);
    }
  };

  const handleSubtabChange = (newSubtab: 'jobs-data' | 'candidates-data') => {
    soundEngine.playClick();
    setSubtab(newSubtab);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <section className="dashboard-view active-view" id="view-analytics">
      {/* Metrics Row */}
      <div className="metrics-grid">
        {/* Metric 1: Total Applicants */}
        <div className="card-metric">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-purple">
              <Users size={18} />
            </div>
            <span className="metric-title">Total Applicants</span>
            <span className="metric-val" id="stat-total-applicants">
              {summary.totalApplicants}
            </span>
          </div>
          <div className="metric-pills">
            <div className="m-pill">
              Career Page <span className="v">0</span>
            </div>
            <div className="m-pill">
              Bulk Upload <span className="v">0</span>
            </div>
            <div className="m-pill">
              Scheduled <span className="v">{summary.screeningCount}</span>
            </div>
            <div className="m-pill">
              Direct Link <span className="v">{summary.totalApplicants - summary.screeningCount}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Resume Analysis */}
        <div className="card-metric">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-orange">
              <FileText size={18} />
            </div>
            <span className="metric-title">Resume Analysis</span>
            <span className="metric-val" id="stat-resume-analysis">
              {summary.resumeCount}
            </span>
          </div>
          <div className="metric-pills">
            <div className="m-pill">
              Analysed <span className="v">{summary.resumeCount}</span>
            </div>
            <div className="m-pill">
              Shortlisted <span className="v">0</span>
            </div>
            <div className="m-pill">
              Waitlisted <span className="v">0</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Recruiter Screening */}
        <div className="card-metric">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-blue">
              <Video size={18} />
            </div>
            <span className="metric-title">Recruiter Screening</span>
            <span className="metric-val" id="stat-recruiter-screening">
              {summary.screeningCount}
            </span>
          </div>
          <div className="metric-pills">
            <div className="m-pill">
              Attempted <span className="v">{summary.screeningCount > 0 ? summary.screeningCount - 1 : 0}</span>
            </div>
            <div className="m-pill">
              Scheduled <span className="v">{summary.screeningCount > 0 ? 1 : 0}</span>
            </div>
            <div className="m-pill">
              Shortlisted <span className="v">0</span>
            </div>
            <div className="m-pill">
              Waitlisted <span className="v">0</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Functional Interview */}
        <div className="card-metric">
          <div className="metric-header">
            <div className="metric-icon-wrap icon-green">
              <CheckCircle size={18} />
            </div>
            <span className="metric-title">Functional Interview</span>
            <span className="metric-val" id="stat-functional-interview">
              {summary.functionalCount}
            </span>
          </div>
          <div className="metric-pills">
            <div className="m-pill">
              Attempted <span className="v">{summary.functionalCount > 0 ? summary.functionalCount - 1 : 0}</span>
            </div>
            <div className="m-pill">
              Scheduled <span className="v">{summary.functionalCount > 0 ? 1 : 0}</span>
            </div>
            <div className="m-pill">
              Shortlisted <span className="v">0</span>
            </div>
            <div className="m-pill">
              Waitlisted <span className="v">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table View Section */}
      <div className="table-card card-glass">
        <div className="table-tabs">
          <button
            className={`table-tab-btn ${subtab === 'jobs-data' ? 'active' : ''}`}
            onClick={() => handleSubtabChange('jobs-data')}
          >
            Jobs data
          </button>
          <button
            className={`table-tab-btn ${subtab === 'candidates-data' ? 'active' : ''}`}
            onClick={() => handleSubtabChange('candidates-data')}
          >
            Candidate data <span className="badge-new">New</span>
          </button>
        </div>

        {/* Table Control Bar */}
        <div className="table-controls">
          <div className="ctrl-left">
            <div className="search-mini">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-ctrl-filter">
              <SlidersHorizontal size={14} style={{ marginRight: '6px' }} />
              Filter
            </button>
          </div>
          <div className="ctrl-right">
            <button className="btn-ctrl-action" onClick={handleColumnConfig}>
              <SlidersHorizontal size={14} style={{ marginRight: '6px' }} />
              Columns
            </button>
            <button className="btn-ctrl-action" onClick={handleExport}>
              <Download size={14} style={{ marginRight: '6px' }} />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Table Data Viewport */}
        <div className="table-responsive">
          {subtab === 'jobs-data' ? (
            <table className="data-table" id="analytics-jobs-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('id')}>
                    Job ID{' '}
                    <span className="arrow">
                      {jobsSortKey === 'id' ? (jobsSortAsc ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('role')}>
                    Role Name{' '}
                    <span className="arrow">
                      {jobsSortKey === 'role' ? (jobsSortAsc ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('card')}>
                    Card Name{' '}
                    <span className="arrow">
                      {jobsSortKey === 'card' ? (jobsSortAsc ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                  <th>Custom Job ID</th>
                  <th>Experience Band</th>
                  <th>Tags</th>
                  <th>Job Created By</th>
                  <th>Collaborators</th>
                  <th>Recruiters</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px' }}>
                      No job data matching query
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="cell-mono">{job.id}</td>
                      <td>
                        <strong>{job.roleName}</strong>
                      </td>
                      <td>{job.cardName}</td>
                      <td>{job.customJobId}</td>
                      <td>{job.experienceBand}</td>
                      <td style={{ color: 'var(--color-text-faint)' }}>-</td>
                      <td>{job.createdBy}</td>
                      <td style={{ color: 'var(--color-text-faint)' }}>-</td>
                      <td style={{ color: 'var(--color-text-faint)' }}>-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table" id="analytics-candidates-table">
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Candidate Name</th>
                  <th>Job Applied</th>
                  <th>Registered On</th>
                  <th>Pipeline Stage</th>
                  <th>Match Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px' }}>
                      No candidates matching query
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-mono">{c.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-mini">
                            {c.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div className="user-details">
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                            <span className="user-email-mini">{c.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{c.jobApplied}</td>
                      <td className="cell-mono">{c.registeredOn}</td>
                      <td>
                        <span
                          className={`badge-role ${
                            c.status === 'Screening'
                              ? 'recruiter'
                              : c.status === 'Functional'
                              ? 'interviewer'
                              : ''
                          }`}
                        >
                          <span className="badge-role-icon"></span>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: 'var(--color-gold)',
                            textShadow: '0 0 8px var(--color-gold-glow)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {c.score}
                        </strong>
                      </td>
                      <td>
                        <button
                          className="table-btn-action"
                          title="View Full Vetting Report"
                          onClick={() => {
                            soundEngine.playClick();
                            openReport(c.id);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer Pagination */}
        <div className="table-footer">
          <span className="showing-txt" id="analytics-table-showing">
            Showing 1-{subtab === 'jobs-data' ? filteredJobs.length : filteredCandidates.length} of{' '}
            {subtab === 'jobs-data' ? filteredJobs.length : filteredCandidates.length}
          </span>
          <div className="pagination-wrap">
            <span className="rows-select-wrap">
              Rows per page:
              <select
                className="rows-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </span>
            <div className="pagination-pages">
              <button className="btn-pag prev" disabled>
                Previous
              </button>
              <span className="page-num">Page 1 of 1</span>
              <button className="btn-pag next" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
