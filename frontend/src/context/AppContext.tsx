'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WSMessage } from '@/types/websocket';
import { soundEngine } from '@/components/SoundEngine';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JobPipeline {
  total: number;
  resume: number;
  screening: number;
  functional: number;
}

export interface Job {
  id: string;
  roleName: string;
  cardName: string;
  created: string;
  status: 'published' | 'draft' | 'archived';
  customJobId: string;
  experienceBand: string;
  createdBy: string;
  pipeline: JobPipeline;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobApplied: string;
  status: 'Resume' | 'Screening' | 'Functional' | 'Hired';
  score: string;
  registeredOn: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  designation: string;
  usertype: string;
  registeredOn: string;
  status: 'Active' | 'Invited' | 'Inactive';
}

// ─── Drawer state ───────────────────────────────────────────────────────────

export type DrawerType = 'job' | 'member' | 'report' | null;

// ─── Context shape ──────────────────────────────────────────────────────────

interface AppContextType {
  // Data
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;

  // Filters & search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Drawers
  activeDrawer: DrawerType;
  openDrawer: (type: DrawerType) => void;
  closeDrawer: () => void;

  // Spotlight
  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;

  // Report drawer target
  reportCandidateId: string | null;
  openReport: (candidateId: string) => void;

  // Helpers
  addJob: (job: Job) => Promise<Job | undefined>;
  addTeamMember: (member: TeamMember) => Promise<void>;
  removeTeamMember: (email: string) => Promise<void>;
  addApplicant: (jobId: string, applicant: Omit<Candidate, 'id' | 'jobApplied' | 'score' | 'registeredOn'>) => Promise<void>;
  addApplicantsBulk: (jobId: string, applicants: Omit<Candidate, 'id' | 'jobApplied' | 'score' | 'registeredOn'>[]) => Promise<void>;
  uploadResumes: (jobId: string, files: File[]) => Promise<void>;
  advanceCandidate: (candidateId: string) => Promise<void>;
  recalculateJobPipelines: () => void;
  wsNotification: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Mappings ──────────────────────────────────────────────────────────────

const mapBackendJob = (j: any): Job => ({
  id: j.id,
  roleName: j.role_name,
  cardName: j.title,
  created: new Date(j.created_at).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }),
  status: j.status,
  customJobId: j.custom_job_id || '-',
  experienceBand: j.experience_band || 'Upto 2 Years',
  createdBy: j.created_by_name || 'Devasri',
  pipeline: {
    total: j.pipeline.total,
    resume: j.pipeline.resume || 0,
    screening: j.pipeline.screening,
    functional: j.pipeline.functional,
  },
});

const mapBackendCandidate = (c: any, jobsList: Job[]): Candidate => {
  const matchingJob = jobsList.find(j => j.id === c.job_id);
  const jobName = matchingJob ? matchingJob.roleName : 'Full Stack Developer';
  
  let status: Candidate['status'] = 'Resume';
  if (c.functional_status === 'completed' || c.functional_status === 'scheduled') {
    status = 'Functional';
  } else if (c.screening_status === 'completed' || c.screening_status === 'scheduled') {
    status = 'Screening';
  }

  let scoreVal = '0%';
  if (c.functional_score !== null && c.functional_score !== undefined) {
    scoreVal = `${Math.round(c.functional_score)}%`;
  } else if (c.screening_score !== null && c.screening_score !== undefined) {
    scoreVal = `${Math.round(c.screening_score)}%`;
  }

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || undefined,
    jobApplied: jobName,
    status,
    score: scoreVal,
    registeredOn: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : '04 Mar 2026, 10:15 AM',
  };
};

const mapBackendTeam = (m: any): TeamMember => ({
  id: m.id,
  name: m.name,
  email: m.email,
  designation: m.designation || 'Collaborator',
  usertype: m.user_type === 'org_admin' ? 'Org. Admin' : 'Collaborator',
  registeredOn: m.registered_on ? new Date(m.registered_on).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : '26 Feb 2026',
  status: m.status === 'active' ? 'Active' : (m.status === 'invited' ? 'Invited' : 'Inactive'),
});

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [reportCandidateId, setReportCandidateId] = useState<string | null>(null);
  const [wsNotification, setWsNotification] = useState<string | null>(null);

  const openDrawer = useCallback((type: DrawerType) => setActiveDrawer(type), []);
  const closeDrawer = useCallback(() => {
    setActiveDrawer(null);
    setReportCandidateId(null);
  }, []);

  const openReport = useCallback((candidateId: string) => {
    setReportCandidateId(candidateId);
    setActiveDrawer('report');
  }, []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      const jobsRes = await fetch(`${API_URL}/api/jobs`);
      if (!jobsRes.ok) throw new Error('Failed to fetch jobs');
      const jobsData = await jobsRes.json();
      const mappedJobs = jobsData.jobs.map(mapBackendJob);
      setJobs(mappedJobs);

      const candidatesRes = await fetch(`${API_URL}/api/usage/candidates-table`);
      if (!candidatesRes.ok) throw new Error('Failed to fetch candidates');
      const candidatesData = await candidatesRes.json();
      const mappedCandidates = candidatesData.map((c: any) => mapBackendCandidate(c, mappedJobs));
      setCandidates(mappedCandidates);

      const teamRes = await fetch(`${API_URL}/api/team`);
      if (!teamRes.ok) throw new Error('Failed to fetch team');
      const teamData = await teamRes.json();
      const mappedTeam = teamData.members.map(mapBackendTeam);
      setTeam(mappedTeam);
    } catch (err) {
      console.error('Error fetching backend data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket connection & candidate update listener
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const handleWSMessage = useCallback((message: WSMessage) => {
    if (message.type === 'candidate_update') {
      soundEngine.playChime([329.63, 440.00, 523.25], 0.2, 0.08);
      setWsNotification(message.content);
      fetchData();
      setTimeout(() => {
        setWsNotification(null);
      }, 5000);
    }
  }, [fetchData]);

  useWebSocket({
    url: wsUrl,
    onMessage: handleWSMessage
  });

  const addJob = useCallback(async (job: Job) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.cardName,
          role_name: job.roleName,
          experience_band: job.experienceBand,
          custom_job_id: job.customJobId !== '-' ? job.customJobId : undefined,
          status: job.status,
          resume_analysis_enabled: true,
          recruiter_screening_enabled: true,
          functional_interview_enabled: true
        })
      });
      if (!res.ok) throw new Error('Failed to create job');
      const newJobData = await res.json();
      const mappedNewJob = mapBackendJob(newJobData);
      setJobs(prev => [mappedNewJob, ...prev]);
      return mappedNewJob;
    } catch (err) {
      console.error('Error adding job:', err);
    }
  }, []);

  const addApplicant = useCallback(async (jobId: string, applicant: Omit<Candidate, 'id' | 'jobApplied' | 'score' | 'registeredOn'>) => {
    try {
      let source = 'direct_link';
      if (applicant.status === 'Screening') source = 'scheduled';
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: applicant.name,
          email: applicant.email,
          phone: applicant.phone,
          source: source
        })
      });
      if (!res.ok) throw new Error('Failed to add applicant');
      const newApp = await res.json();
      
      // Patch stage info if they are at Screening or Functional
      if (applicant.status === 'Screening' || applicant.status === 'Functional') {
        let screening_status = null;
        let functional_status = null;
        let screening_score = null;
        let functional_score = null;
        
        if (applicant.status === 'Screening') {
          screening_status = 'scheduled';
          screening_score = 90.0;
        } else if (applicant.status === 'Functional') {
          functional_status = 'completed';
          functional_score = 95.0;
        }
        
        await fetch(`${API_URL}/api/jobs/applicants/${newApp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screening_status,
            screening_score,
            functional_status,
            functional_score,
            resume_analysed: true
          })
        });
      }
      fetchData();
    } catch (err) {
      console.error('Error adding applicant:', err);
    }
  }, [fetchData]);

  const addApplicantsBulk = useCallback(async (jobId: string, applicants: Omit<Candidate, 'id' | 'jobApplied' | 'score' | 'registeredOn'>[]) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/applicants/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicants: applicants.map(app => ({
            name: app.name,
            email: app.email,
            phone: app.phone,
            source: 'bulk_upload'
          }))
        })
      });
      if (!res.ok) throw new Error('Failed to add bulk applicants');
      await fetchData();
    } catch (err) {
      console.error('Error adding bulk applicants:', err);
    }
  }, [fetchData]);

  const uploadResumes = useCallback(async (jobId: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/applicants/upload-resumes`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload resumes');
      await fetchData();
    } catch (err) {
      console.error('Error uploading resumes:', err);
    }
  }, [fetchData]);

  const addTeamMember = useCallback(async (member: TeamMember) => {
    try {
      const res = await fetch(`${API_URL}/api/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          designation: member.designation,
          user_type: member.usertype === 'Org. Admin' ? 'org_admin' : 'member'
        })
      });
      if (!res.ok) throw new Error('Failed to invite member');
      const newUser = await res.json();
      setTeam(prev => [...prev, mapBackendTeam(newUser)]);
    } catch (err) {
      console.error('Error inviting member:', err);
    }
  }, []);

  const removeTeamMember = useCallback(async (email: string) => {
    try {
      const member = team.find(t => t.email === email);
      if (!member || !member.id) return;
      
      const res = await fetch(`${API_URL}/api/team/${member.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove member');
      
      setTeam(prev => prev.filter(t => t.email !== email));
    } catch (err) {
      console.error('Error removing team member:', err);
    }
  }, [team]);

  const advanceCandidate = useCallback(async (candidateId: string) => {
    const c = candidates.find(cand => cand.id === candidateId);
    if (!c) return;
    
    let patchData: any = {};
    if (c.status === 'Resume') {
      patchData.screening_status = 'scheduled';
      patchData.screening_score = 80.0;
    } else if (c.status === 'Screening') {
      patchData.functional_status = 'completed';
      patchData.functional_score = 90.0;
    } else if (c.status === 'Functional') {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/jobs/applicants/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
      if (!res.ok) throw new Error('Failed to update candidate');
      
      fetchData();
    } catch (err) {
      console.error('Error advancing candidate:', err);
    }
  }, [candidates, fetchData]);

  const recalculateJobPipelines = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppContext.Provider
      value={{
        jobs, setJobs,
        candidates, setCandidates,
        team, setTeam,
        globalSearch, setGlobalSearch,
        activeDrawer, openDrawer, closeDrawer,
        spotlightOpen, setSpotlightOpen,
        reportCandidateId, openReport,
        addJob, addTeamMember, removeTeamMember, addApplicant, addApplicantsBulk, uploadResumes, advanceCandidate, recalculateJobPipelines,
        wsNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
