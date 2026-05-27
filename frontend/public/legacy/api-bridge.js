// ==========================================
// API BRIDGE — Connects dashboard.js to FastAPI backend
// Loads BEFORE dashboard.js. Populates AppState with real data,
// then patches form handlers and WebSocket forwarding.
// ==========================================

(function () {
  'use strict';

  // ─── Config ─────────────────────────────────────────────────────────────────
  // Reads from Next.js injected env via window global (set in page.tsx)
  const API = window.__NEXT_API_URL__ || 'http://localhost:8000';

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async function apiFetch(path, options = {}) {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!res.ok) {
        console.warn(`[API Bridge] ${options.method || 'GET'} ${path} → ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn(`[API Bridge] Network error for ${path}:`, err.message);
      return null;
    }
  }

  // ─── Data Normalizers ────────────────────────────────────────────────────────

  function normalizeJob(j) {
    return {
      id: j.custom_job_id && j.custom_job_id !== '-' ? j.custom_job_id : j.id,
      _uuid: j.id,          // Keep real UUID for API calls
      roleName: j.role_name || j.title,
      cardName: j.title,
      created: j.created_at
        ? new Date(j.created_at).toLocaleString('en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })
        : '-',
      status: j.status || 'draft',
      customJobId: j.custom_job_id || '-',
      experienceBand: j.experience_band || '-',
      createdBy: j.created_by_name || 'Admin',
      pipeline: {
        total: j.pipeline ? j.pipeline.total : 0,
        resume: j.pipeline ? (j.pipeline.resume || 0) : 0,
        screening: j.pipeline ? j.pipeline.screening : 0,
        functional: j.pipeline ? j.pipeline.functional : 0,
      },
    };
  }

  function normalizeCandidate(c) {
    // Determine pipeline stage label from backend status fields
    let status = 'Resume';
    if (c.functional_status) status = 'Functional';
    else if (c.screening_status) status = 'Screening';

    const score = c.functional_score
      ? `${Math.round(c.functional_score)}%`
      : c.screening_score
      ? `${Math.round(c.screening_score)}%`
      : '-';

    return {
      id: c.id,
      _jobId: c.job_id,
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      jobApplied: c.role_name || c.title || '—',   // filled in after job lookup
      status,
      score,
      registeredOn: c.created_at
        ? new Date(c.created_at).toLocaleString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })
        : '-',
    };
  }

  function normalizeMember(m) {
    const statusMap = { active: 'Active', invited: 'Invited', inactive: 'Inactive' };
    const roleMap = {
      admin: 'Org. Admin',
      member: 'Member',
      recruiter: 'Recruiter',
      interviewer: 'Interviewer',
    };
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      designation: m.designation || '-',
      usertype: roleMap[m.user_type] || m.user_type || 'Member',
      registeredOn: m.registered_on
        ? new Date(m.registered_on).toLocaleString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })
        : '-',
      status: statusMap[m.status] || 'Active',
    };
  }

  // ─── Main Data Loader ────────────────────────────────────────────────────────

  async function loadDashboardData() {
    console.log('[API Bridge] Fetching data from backend…');

    // Parallel fetch all endpoints
    const [jobsData, candidatesData, teamData, statsData] = await Promise.all([
      apiFetch('/api/jobs'),
      apiFetch('/api/usage/candidates-table'),
      apiFetch('/api/team'),
      apiFetch('/api/usage/stats'),
    ]);

    // ── Jobs ──────────────────────────────────────────────────────────────────
    if (jobsData && jobsData.jobs && jobsData.jobs.length > 0) {
      AppState.jobs = jobsData.jobs.map(normalizeJob);
      console.log(`[API Bridge] Loaded ${AppState.jobs.length} jobs from backend.`);
    } else {
      console.log('[API Bridge] No jobs from backend, keeping mock data.');
    }

    // ── Candidates ────────────────────────────────────────────────────────────
    if (candidatesData && candidatesData.length > 0) {
      // Build a job ID → roleName map for labeling candidates
      const jobMap = {};
      if (jobsData && jobsData.jobs) {
        jobsData.jobs.forEach(j => { jobMap[j.id] = j.role_name || j.title; });
      }

      AppState.candidates = candidatesData.map(c => {
        const cand = normalizeCandidate(c);
        cand.jobApplied = jobMap[c.job_id] || '—';
        return cand;
      });
      console.log(`[API Bridge] Loaded ${AppState.candidates.length} candidates from backend.`);
    } else {
      console.log('[API Bridge] No candidates from backend, keeping mock data.');
    }

    // ── Team ──────────────────────────────────────────────────────────────────
    if (teamData && teamData.members && teamData.members.length > 0) {
      AppState.team = teamData.members.map(normalizeMember);
      console.log(`[API Bridge] Loaded ${AppState.team.length} team members from backend.`);
    } else {
      console.log('[API Bridge] No team members from backend, keeping mock data.');
    }

    // ── Usage Stats (update metric cards directly) ────────────────────────────
    if (statsData) {
      // These are patched into the DOM after initDashboard renders them
      AppState._usageStats = statsData;
    }
  }

  // ─── Patch Summary Metrics to use real stats ─────────────────────────────────

  function patchSummaryMetrics() {
    const stats = AppState._usageStats;
    if (!stats) return;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('stat-total-applicants', stats.total_applicants);
    set('stat-resume-analysis', stats.resume_analysed);
    set('stat-recruiter-screening', stats.screening_attempted);
    set('stat-functional-interview', stats.functional_attempted);

    // Pills under Total Applicants card
    const appPills = document.querySelectorAll('.card-metric:nth-child(1) .m-pill .v');
    if (appPills.length >= 4) {
      appPills[0].textContent = stats.career_page;
      appPills[1].textContent = stats.bulk_upload;
      appPills[2].textContent = stats.scheduled;
      appPills[3].textContent = stats.direct_link;
    }

    // Pills under Resume Analysis card
    const resPills = document.querySelectorAll('.card-metric:nth-child(2) .m-pill .v');
    if (resPills.length >= 3) {
      resPills[0].textContent = stats.resume_analysed;
      resPills[1].textContent = stats.resume_shortlisted;
      resPills[2].textContent = stats.resume_waitlisted;
    }

    // Pills under Recruiter Screening card
    const scrPills = document.querySelectorAll('.card-metric:nth-child(3) .m-pill .v');
    if (scrPills.length >= 4) {
      scrPills[0].textContent = stats.screening_attempted;
      scrPills[1].textContent = stats.screening_scheduled;
      scrPills[2].textContent = stats.screening_shortlisted;
      scrPills[3].textContent = stats.screening_waitlisted;
    }

    // Pills under Functional Interview card
    const funPills = document.querySelectorAll('.card-metric:nth-child(4) .m-pill .v');
    if (funPills.length >= 4) {
      funPills[0].textContent = stats.functional_attempted;
      funPills[1].textContent = stats.functional_scheduled;
      funPills[2].textContent = stats.functional_shortlisted;
      funPills[3].textContent = stats.functional_waitlisted;
    }
  }

  // ─── Patch Create-Job Form → Real API ────────────────────────────────────────

  function patchCreateJobForm() {
    const form = document.getElementById('form-create-job');
    if (!form) return;

    // Wrap: let the existing handler fire first (local state + UI),
    // then persist to backend silently.
    form.addEventListener('submit', async () => {
      // Give the original handler 50ms to finish running
      await new Promise(r => setTimeout(r, 50));

      // The newest job was just pushed to AppState.jobs by the original handler
      const latest = AppState.jobs[AppState.jobs.length - 1];
      if (!latest) return;

      const body = {
        title: latest.cardName,
        role_name: latest.roleName,
        experience_band: latest.experienceBand !== '-' ? latest.experienceBand : null,
        custom_job_id: latest.customJobId !== '-' ? latest.customJobId : null,
        status: 'published',
        is_job_listed: true,
        resume_analysis_enabled: document.getElementById('chk-resume')?.checked ?? false,
        recruiter_screening_enabled: document.getElementById('chk-screening')?.checked ?? false,
        functional_interview_enabled: document.getElementById('chk-functional')?.checked ?? false,
      };

      const result = await apiFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result) {
        // Patch the local job's UUID so future API calls use the real ID
        latest._uuid = result.id;
        console.log('[API Bridge] Job created in backend:', result.id);
      }
    }, { capture: false });
  }

  // ─── Patch Invite-Member Form → Real API ─────────────────────────────────────

  function patchInviteMemberForm() {
    const form = document.getElementById('form-invite-member');
    if (!form) return;

    form.addEventListener('submit', async () => {
      await new Promise(r => setTimeout(r, 50));

      const latest = AppState.team[AppState.team.length - 1];
      if (!latest) return;

      const roleReverseMap = {
        'Org. Admin': 'admin',
        Member: 'member',
        Recruiter: 'recruiter',
        Interviewer: 'interviewer',
      };

      const body = {
        name: latest.name,
        email: latest.email,
        designation: latest.designation !== '-' ? latest.designation : null,
        user_type: roleReverseMap[latest.usertype] || 'member',
      };

      const result = await apiFetch('/api/team/invite', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result) {
        latest.id = result.id;
        console.log('[API Bridge] Team member invited in backend:', result.id);
      }
    }, { capture: false });
  }

  // ─── Patch Career Page Form → Real API ───────────────────────────────────────

  function patchCareerSettingsForm() {
    const form = document.getElementById('career-settings-form');
    if (!form) return;

    form.addEventListener('submit', async () => {
      await new Promise(r => setTimeout(r, 50));

      const orgName = document.getElementById('career-org-name')?.value || '';
      const domain  = document.getElementById('career-subdomain')?.value || '';
      const email   = document.getElementById('career-email')?.value || '';
      const website = document.getElementById('career-website')?.value || '';
      const location= document.getElementById('career-location')?.value || '';
      const description = document.getElementById('career-description')?.value || '';

      const body = {
        org_name: orgName || 'My Organisation',
        domain: domain || null,
        contact_email: email || null,
        website_link: website || null,
        location: location || null,
        description: description || null,
      };

      const result = await apiFetch('/api/career', {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (result) {
        console.log('[API Bridge] Career page saved:', result.id);
      }
    }, { capture: false });
  }

  // ─── Patch Password Form → Real API ──────────────────────────────────────────

  function patchPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      // Let original handler validate first (match check etc.)
      await new Promise(r => setTimeout(r, 50));

      const alertBox = document.getElementById('pass-success');
      if (alertBox && alertBox.style.color === 'var(--color-orange)') return; // Validation failed

      const currentPass = document.getElementById('current-pass')?.value;
      const newPass     = document.getElementById('new-pass')?.value;
      if (!currentPass || !newPass) return;

      await apiFetch('/api/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
      });

      console.log('[API Bridge] Password change request sent to backend.');
    }, { capture: false });
  }

  // ─── Forward WebSocket Events to Swarm Terminal ───────────────────────────────

  function initWSForwarding() {
    // page.tsx exposes WS messages via a CustomEvent 'ws-message'
    window.addEventListener('ws-message', (e) => {
      const msg = e.detail;
      if (!msg || msg.type === 'pong' || msg.type === 'welcome') return;

      // Forward to swarm terminal if it exists
      if (typeof appendTerminalLog === 'function') {
        const time = new Date().toLocaleTimeString();
        const content = msg.content || JSON.stringify(msg);
        appendTerminalLog(`<code>[${time}] Backend Event:</code> ${content}`);
      }
    });
  }

  // ─── Load Career Page Data into Form ─────────────────────────────────────────

  async function loadCareerPage() {
    const data = await apiFetch('/api/career');
    if (!data) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    };

    setVal('career-org-name', data.org_name);
    setVal('career-subdomain', data.domain);
    setVal('career-email', data.contact_email);
    setVal('career-website', data.website_link);
    setVal('career-location', data.location);
    setVal('career-description', data.description);

    // Update the displayed career link
    if (data.domain) {
      const statusLink = document.querySelector('.status-link');
      if (statusLink) {
        statusLink.textContent = `interviehire.com/careers/${data.domain} ↗`;
        statusLink.href = `https://interviehire.com/careers/${data.domain}`;
      }
    }
    console.log('[API Bridge] Career page data loaded into form.');
  }

  // ─── Boot Sequence ────────────────────────────────────────────────────────────
  // Intercept initDashboard to run our data loader first.
  // dashboard.js registers initDashboard → called by DOMContentLoaded.
  // We override that flow by wrapping document.addEventListener once.

  let originalAddEventListener = document.addEventListener.bind(document);
  let domReadyPatched = false;

  document.addEventListener = function (type, listener, options) {
    if (type === 'DOMContentLoaded' && !domReadyPatched) {
      domReadyPatched = true;

      const wrappedListener = async function (event) {
        console.log('[API Bridge] Intercepted DOMContentLoaded — loading backend data first…');
        await loadDashboardData();
        listener(event);                           // Call initDashboard()

        // Post-init patches (form handlers, stats)
        patchCreateJobForm();
        patchInviteMemberForm();
        patchCareerSettingsForm();
        patchPasswordForm();
        patchSummaryMetrics();
        loadCareerPage();
        initWSForwarding();

        console.log('[API Bridge] All patches applied. Dashboard wired to backend ✓');
      };

      return originalAddEventListener('DOMContentLoaded', wrappedListener, options);
    }

    return originalAddEventListener(type, listener, options);
  };

  // Handle case where DOM is already ready when this script loads
  // (Next.js can mount after DOMContentLoaded fires)
  if (document.readyState !== 'loading') {
    // dashboard.js will call initDashboard() directly in this case
    // We hook into the already-scheduled execution by waiting for
    // window.__dashboardReady signal set by a patched initDashboard
    const originalIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));

    loadDashboardData().then(() => {
      // Patch forms once DOM is ready
      requestAnimationFrame(() => {
        patchCreateJobForm();
        patchInviteMemberForm();
        patchCareerSettingsForm();
        patchPasswordForm();
        patchSummaryMetrics();
        loadCareerPage();
        initWSForwarding();
        console.log('[API Bridge] Patched in readyState=interactive/complete mode ✓');
      });
    });
  }

})();
