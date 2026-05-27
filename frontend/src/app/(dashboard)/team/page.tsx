'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { soundEngine } from '@/components/SoundEngine';
import {
  Search,
  SlidersHorizontal,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function TeamPage() {
  const { team, setTeam } = useAppContext();
  const [teamFilter, setTeamFilter] = useState<'all' | 'active' | 'invited' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [limit, setLimit] = useState(20);

  // 1. Calculate counters
  const counters = useMemo(() => {
    const total = team.length;
    const active = team.filter((t) => t.status === 'Active').length;
    const invited = team.filter((t) => t.status === 'Invited').length;
    const inactive = team.filter((t) => t.status === 'Inactive').length;

    return { total, active, invited, inactive };
  }, [team]);

  // 2. Filter list
  const filteredTeam = useMemo(() => {
    return team.filter((member) => {
      // Status filter
      if (teamFilter !== 'all' && member.status.toLowerCase() !== teamFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== 'all' && member.usertype !== roleFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(q) ||
          member.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [team, teamFilter, roleFilter, searchQuery]);

  // Columns toggle button placeholder handler
  const handleColumnConfig = () => {
    soundEngine.playClick();
    alert('Column configuration details can be linked to your team custom database.');
  };

  // Export CSV
  const handleExport = () => {
    soundEngine.playChime([523.25, 659.25, 783.99], 0.2, 0.08);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Team Member,Email,Designation,Usertype,Registered On,Status\n';
    team.forEach((t) => {
      csvContent += `"${t.name}","${t.email}","${t.designation}","${t.usertype}","${t.registeredOn}","${t.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'interviehire_team_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeactivate = (email: string) => {
    soundEngine.playClick();
    setTeam((prev) =>
      prev.map((t) => {
        if (t.email === email && t.name !== 'Devasri') {
          return { ...t, status: 'Inactive' };
        }
        return t;
      })
    );
  };

  return (
    <section className="dashboard-view active-view" id="view-team">
      {/* Team filtering tabs */}
      <div className="view-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="filter-options" id="team-status-tabs">
          <button
            className={`filter-tab ${teamFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setTeamFilter('all');
            }}
          >
            Team TOTAL (<span className="team-count-all">{counters.total}</span>)
          </button>
          <button
            className={`filter-tab ${teamFilter === 'active' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setTeamFilter('active');
            }}
          >
            Active (<span className="team-count-active">{counters.active}</span>)
          </button>
          <button
            className={`filter-tab ${teamFilter === 'invited' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setTeamFilter('invited');
            }}
          >
            Invited (<span className="team-count-invited">{counters.invited}</span>)
          </button>
          <button
            className={`filter-tab ${teamFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setTeamFilter('inactive');
            }}
          >
            Inactive (<span className="team-count-inactive">{counters.inactive}</span>)
          </button>
        </div>
      </div>

      {/* Team Access Table */}
      <div className="table-card card-glass">
        <div className="table-controls">
          <div className="ctrl-left">
            <div className="search-mini">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                id="team-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="meta-select-styled"
              id="team-role-filter"
              value={roleFilter}
              onChange={(e) => {
                soundEngine.playClick();
                setRoleFilter(e.target.value);
              }}
            >
              <option value="all">All Usertypes</option>
              <option value="Org. Admin">Org. Admin</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Interviewer">Interviewer</option>
            </select>
          </div>
          <div className="ctrl-right">
            <button className="btn-ctrl-action" onClick={handleColumnConfig}>
              <SlidersHorizontal size={14} style={{ marginRight: '6px' }} />
              Columns
            </button>
            <button className="btn-ctrl-action" onClick={handleExport}>
              <Download size={14} style={{ marginRight: '6px' }} />
              Export
            </button>
          </div>
        </div>

        {/* Team table viewport */}
        <div className="table-responsive">
          <table className="data-table" id="team-members-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Designation</th>
                <th>Usertype</th>
                <th>Registered On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px' }}>
                    No team members matching criteria
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => {
                  let statusClass = 'published';
                  if (member.status === 'Invited') statusClass = 'draft';
                  if (member.status === 'Inactive') statusClass = 'archived';

                  return (
                    <tr key={member.email}>
                      <td>
                        <div className="user-cell">
                          <div
                            className="user-avatar-mini"
                            style={{
                              backgroundColor: 'var(--color-gold-dim)',
                              borderColor: 'var(--color-gold)',
                              color: 'var(--color-gold-light)',
                            }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div className="user-details">
                            <span style={{ fontWeight: 600 }}>
                              {member.name} {member.name === 'Devasri' ? '(me)' : ''}
                            </span>
                            <span className="user-email-mini">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{member.designation}</td>
                      <td>
                        <span
                          className={`badge-role ${
                            member.usertype === 'Recruiter'
                              ? 'recruiter'
                              : member.usertype === 'Interviewer'
                              ? 'interviewer'
                              : ''
                          }`}
                        >
                          <span className="badge-role-icon"></span>
                          {member.usertype}
                        </span>
                      </td>
                      <td className="cell-mono">{member.registeredOn}</td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>
                          <span className="status-badge-dot"></span>
                          {member.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-btn-action"
                          style={{
                            color: 'var(--color-orange)',
                            opacity: member.name === 'Devasri' || member.status === 'Inactive' ? 0.3 : 1,
                            cursor: member.name === 'Devasri' || member.status === 'Inactive' ? 'not-allowed' : 'pointer',
                          }}
                          title="Deactivate Member"
                          disabled={member.name === 'Devasri' || member.status === 'Inactive'}
                          onClick={() => handleDeactivate(member.email)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Team Table Footer */}
        <div className="table-footer">
          <span className="showing-txt" id="team-table-showing">
            Showing 1-{filteredTeam.length} of {filteredTeam.length}
          </span>
          <div className="pagination-wrap">
            <span className="rows-select-wrap">
              Rows per page:
              <select
                className="rows-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </span>
            <div className="pagination-pages">
              <button className="btn-pag prev" disabled>
                Previous
              </button>
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
