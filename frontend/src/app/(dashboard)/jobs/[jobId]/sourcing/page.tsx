'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { 
  FileSpreadsheet, 
  FileText, 
  UserPlus, 
  Link2, 
  Lock, 
  Upload, 
  Download, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { soundEngine } from '@/components/SoundEngine';

export default function SourcingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { jobs, addApplicant, addApplicantsBulk, uploadResumes, recalculateJobPipelines } = useAppContext();

  // Find active job
  const job = useMemo(() => jobs.find(j => j.id === jobId), [jobs, jobId]);

  // Tab State: 'analyse' | 'schedule'
  const [activeTab, setActiveTab] = useState<'analyse' | 'schedule'>('analyse');

  // Sourcing Method State: 'csv' | 'resumes' | 'manual' | 'ats'
  const [activeMethod, setActiveMethod] = useState<'csv' | 'resumes' | 'manual' | 'ats'>('csv');

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // File states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [selectedResumes, setSelectedResumes] = useState<File[]>([]);

  // Manual Form States
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);

  // Drag states
  const [isDragging, setIsDragging] = useState(false);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropCSV = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setSuccessCount(null);
        soundEngine.playChime([329.63], 0.1, 0.05);
      } else {
        alert('Please drop a valid .csv file');
      }
    }
  };

  const handleDropResumes = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setSelectedResumes(Array.from(e.dataTransfer.files));
      setSuccessCount(null);
      soundEngine.playChime([329.63], 0.1, 0.05);
    }
  };

  // CSV Change
  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSuccessCount(null);
    }
  };

  // Resume Change
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedResumes(Array.from(e.target.files));
      setSuccessCount(null);
    }
  };

  // Process CSV Upload
  const processCSV = async () => {
    if (!selectedFile || !job) return;
    setIsProcessing(true);
    setProgressVal(10);
    setProcessingStep('Reading CSV file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setProgressVal(35);
        setProcessingStep('Parsing headers and candidate details...');
        
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          throw new Error('CSV is empty or missing headers');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const emailIdx = headers.indexOf('email');
        const phoneIdx = headers.indexOf('phone');

        if (nameIdx === -1 || emailIdx === -1) {
          throw new Error('CSV must contain "Name" and "Email" columns.');
        }

        const parsedApplicants = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(',').map(c => c.trim());
          if (cols.length < Math.max(nameIdx, emailIdx) + 1) continue;

          const name = cols[nameIdx];
          const email = cols[emailIdx];
          const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';

          if (name && email) {
            parsedApplicants.push({ name, email, phone });
          }
        }

        if (parsedApplicants.length === 0) {
          throw new Error('No valid candidate rows found.');
        }

        setProgressVal(60);
        setProcessingStep('Uploading candidates in bulk to backend...');

        await addApplicantsBulk(job.id, parsedApplicants.map(app => ({
          name: app.name,
          email: app.email,
          phone: app.phone || undefined,
          status: 'Resume'
        })));

        setProgressVal(100);
        setProcessingStep('Successfully imported candidates!');
        soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);
        setSuccessCount(parsedApplicants.length);
        setSelectedFile(null);
        recalculateJobPipelines();
      } catch (err: any) {
        alert(err.message || 'Error processing CSV.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Process Resume uploads (Backend upload + visual steps)
  const processResumes = async () => {
    if (selectedResumes.length === 0 || !job) return;
    setIsProcessing(true);
    setSuccessCount(null);

    try {
      setProgressVal(20);
      setProcessingStep('Uploading candidate resumes to backend...');
      await uploadResumes(job.id, selectedResumes);

      // Trigger beautiful UI progression steps
      const steps = [
        { p: 45, text: 'Executing text extraction and PDF parsing...' },
        { p: 70, text: 'AI Analyzer: Summarizing professional experience...' },
        { p: 90, text: 'Evaluating technical matches & skills match...' },
        { p: 100, text: 'Analysis finished successfully!' }
      ];

      for (const step of steps) {
        setProgressVal(step.p);
        setProcessingStep(step.text);
        await new Promise(r => setTimeout(r, 850));
      }

      soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);
      setSuccessCount(selectedResumes.length);
      setSelectedResumes([]);
      recalculateJobPipelines();
    } catch (err) {
      console.error(err);
      alert('Failed to upload and analyze resumes.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add manually
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !manualName || !manualEmail) return;

    setIsProcessing(true);
    try {
      await addApplicant(job.id, {
        name: manualName,
        email: manualEmail,
        phone: manualPhone || undefined,
        status: 'Resume'
      });
      soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);
      setManualSuccess(true);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      recalculateJobPipelines();
      setTimeout(() => setManualSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download template CSV
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone\nAditya Rana,aditya@interviehire.com,+919988776655\nJohn Doe,john.doe@recruit.io,\nJane Smith,jane.smith@ats.com,+1555019203";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "interviehire_candidate_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!job) {
    return (
      <section className="dashboard-view active-view">
        <div className="empty-state card-glass" style={{ padding: 48, textAlign: 'center' }}>
          <h3 className="type-h3" style={{ marginBottom: 8 }}>Job not found</h3>
          <p className="type-caption">The job posting you are trying to source for does not exist.</p>
          <button className="btn-action" style={{ marginTop: 16 }} onClick={() => router.push('/jobs')}>← Back to Jobs</button>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-view active-view" id="view-sourcing">
      {/* Sourcing Header / Breadcrumb Bar */}
      <div className="sourcing-header-bar card-glass">
        <div className="sourcing-breadcrumb">
          <span className="crumb" onClick={() => router.push('/jobs')}>Jobs</span>
          <ChevronRight size={14} className="separator" />
          <span className="crumb truncate-crumb" onClick={() => router.push(`/jobs/${job.id}`)}>{job.roleName}</span>
          <ChevronRight size={14} className="separator" />
          <span className="crumb active">Sourcing</span>
        </div>
        <div className="sourcing-header-actions">
          <button className="btn-jd-ghost" onClick={() => alert('Add Collaborator feature is available in Settings.')}>
            <Plus size={14} /> Add Collaborator
          </button>
          <button className="btn-jd-primary" onClick={() => router.push(`/jobs/${job.id}`)}>
            View Responses
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="sourcing-tabs-row">
        <button 
          className={`sourcing-tab-btn ${activeTab === 'analyse' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('analyse');
            setSuccessCount(null);
          }}
        >
          <FileText size={16} />
          Analyse Candidate Resumes
        </button>
        <button 
          className={`sourcing-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('schedule');
            setSuccessCount(null);
          }}
        >
          <Users size={16} />
          Schedule AI Interviews
        </button>
      </div>

      {activeTab === 'analyse' ? (
        <div className="sourcing-content-container">
          {/* Method Cards Selector */}
          <div className="sourcing-cards-grid">
            {/* Upload Sheet */}
            <div 
              className={`sourcing-selector-card ${activeMethod === 'csv' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('csv'); setSuccessCount(null); }}
            >
              <div className="icon-wrap color-csv">
                <FileSpreadsheet size={20} />
              </div>
              <div className="card-info">
                <h4>Upload Sheet (CSV)</h4>
                <p>Import candidates from a spreadsheet</p>
              </div>
              {activeMethod === 'csv' && <div className="active-dot" />}
            </div>

            {/* Upload Resumes */}
            <div 
              className={`sourcing-selector-card ${activeMethod === 'resumes' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('resumes'); setSuccessCount(null); }}
            >
              <div className="icon-wrap color-resumes">
                <Upload size={20} />
              </div>
              <div className="card-info">
                <h4>Upload Resumes</h4>
                <p>Upload single or multiple resumes as file</p>
              </div>
              {activeMethod === 'resumes' && <div className="active-dot" />}
            </div>

            {/* Add Manually */}
            <div 
              className={`sourcing-selector-card ${activeMethod === 'manual' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('manual'); setSuccessCount(null); }}
            >
              <div className="icon-wrap color-manual">
                <UserPlus size={20} />
              </div>
              <div className="card-info">
                <h4>Add Manually</h4>
                <p>Enter candidate details manually</p>
              </div>
              {activeMethod === 'manual' && <div className="active-dot" />}
            </div>

            {/* Connect ATS */}
            <div 
              className={`sourcing-selector-card locked ${activeMethod === 'ats' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('ats'); setSuccessCount(null); }}
            >
              <div className="icon-wrap color-ats">
                <Link2 size={20} />
              </div>
              <div className="card-info">
                <h4>Connect ATS</h4>
                <p>Import applicants from your ATS</p>
              </div>
              <div className="lock-badge">
                <Lock size={12} />
              </div>
            </div>
          </div>

          {/* Sourcing Display Pane */}
          <div className="sourcing-panel card-glass">
            
            {/* METHOD: CSV Uploader */}
            {activeMethod === 'csv' && (
              <div className="method-view animate-fade">
                {isProcessing ? (
                  <div className="processing-indicator">
                    <RefreshCw className="spinner" size={32} />
                    <h3 className="type-h3">{processingStep}</h3>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${progressVal}%` }} />
                    </div>
                    <span className="pct-val">{progressVal}% Complete</span>
                  </div>
                ) : successCount !== null ? (
                  <div className="success-indicator">
                    <div className="icon-check">
                      <Check size={32} />
                    </div>
                    <h3 className="type-h3">Successfully Imported!</h3>
                    <p className="type-caption">Parsed and added <strong>{successCount}</strong> candidates directly to the pipeline database.</p>
                    <button className="btn-jd-ghost" onClick={() => setSuccessCount(null)}>Import more sheets</button>
                  </div>
                ) : (
                  <div className="upload-layout">
                    <div 
                      className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropCSV}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleCSVChange} 
                        accept=".csv" 
                        style={{ display: 'none' }} 
                      />
                      <div className="upload-icon-circle">
                        <FileSpreadsheet size={36} />
                      </div>
                      <h3>{selectedFile ? selectedFile.name : 'Drop your sheet as .csv file here'}</h3>
                      <p>Columns: Name, Email, Phone (optional)</p>
                      
                      <button type="button" className="btn-jd-ghost" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Browse Files
                      </button>
                    </div>

                    <div className="upload-footer-row">
                      <span className="notice-info">
                        <AlertCircle size={14} /> Add candidate details like name, email and phone to a Sheet (CSV) (<span className="link-anchor" onClick={downloadTemplate}>View guide</span>).
                      </span>
                      <button className="download-template-link" onClick={downloadTemplate}>
                        <Download size={14} /> Download template
                      </button>
                    </div>

                    {selectedFile && (
                      <button className="btn-submit btn-process-trigger" onClick={processCSV}>
                        Start Spreadsheet Import <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* METHOD: Resume Analyzer */}
            {activeMethod === 'resumes' && (
              <div className="method-view animate-fade">
                {isProcessing ? (
                  <div className="processing-indicator">
                    <RefreshCw className="spinner" size={32} />
                    <h3 className="type-h3">{processingStep}</h3>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${progressVal}%` }} />
                    </div>
                    <span className="pct-val">{progressVal}% Complete</span>
                  </div>
                ) : successCount !== null ? (
                  <div className="success-indicator">
                    <div className="icon-check">
                      <Check size={32} />
                    </div>
                    <h3 className="type-h3">Analysis Complete!</h3>
                    <p className="type-caption">Successfully parsed <strong>{successCount}</strong> resumes. Profiles are saved under the "Resume Analysis" stage.</p>
                    <button className="btn-jd-ghost" onClick={() => setSuccessCount(null)}>Upload more resumes</button>
                  </div>
                ) : (
                  <div className="upload-layout">
                    <div 
                      className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropResumes}
                      onClick={() => resumeInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={resumeInputRef} 
                        onChange={handleResumeChange} 
                        multiple 
                        accept=".pdf,.docx,.doc" 
                        style={{ display: 'none' }} 
                      />
                      <div className="upload-icon-circle">
                        <Upload size={36} />
                      </div>
                      <h3>
                        {selectedResumes.length > 0 
                          ? `Selected ${selectedResumes.length} resume file(s)` 
                          : 'Drop candidate resume files here'
                        }
                      </h3>
                      <p>Supports PDF, DOCX, DOC files (max 10MB per file)</p>
                      
                      <button type="button" className="btn-jd-ghost" onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}>
                        Browse Files
                      </button>
                    </div>

                    {selectedResumes.length > 0 && (
                      <div className="selected-resumes-list">
                        <h5>Files selected:</h5>
                        <ul>
                          {selectedResumes.map((file, idx) => (
                            <li key={idx}>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                          ))}
                        </ul>
                        <button className="btn-submit btn-process-trigger" onClick={processResumes}>
                          Analyse Candidate Resumes <Sparkles size={14} style={{ marginLeft: 6 }} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* METHOD: Add Manually */}
            {activeMethod === 'manual' && (
              <div className="method-view manual-view animate-fade">
                {manualSuccess && (
                  <div className="toast-success-embed">
                    <Check size={14} /> Candidate details registered successfully!
                  </div>
                )}
                
                <h3 className="type-h3" style={{ marginBottom: '6px' }}>Add Candidate Details</h3>
                <p className="type-caption" style={{ marginBottom: '24px' }}>Input the applicant's details directly into the recruiter database.</p>

                <form onSubmit={handleManualSubmit} className="manual-candidate-form">
                  <div className="form-group-row">
                    <div className="form-group flex-1">
                      <label htmlFor="man-name">Candidate Name *</label>
                      <input 
                        type="text" 
                        id="man-name" 
                        placeholder="e.g. Vansh Rajput" 
                        value={manualName} 
                        onChange={(e) => setManualName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label htmlFor="man-email">Work Email Address *</label>
                      <input 
                        type="email" 
                        id="man-email" 
                        placeholder="e.g. vansh@zeko.ai" 
                        value={manualEmail} 
                        onChange={(e) => setManualEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="man-phone">Mobile Phone (Optional)</label>
                    <input 
                      type="tel" 
                      id="man-phone" 
                      placeholder="e.g. +91 9876543210" 
                      value={manualPhone} 
                      onChange={(e) => setManualPhone(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={isProcessing}>
                    {isProcessing ? 'Saving Candidate...' : 'Add Candidate Profile'}
                  </button>
                </form>
              </div>
            )}

            {/* METHOD: Connect ATS */}
            {activeMethod === 'ats' && (
              <div className="method-view ats-locked-view animate-fade">
                <div className="locked-shield">
                  <Lock size={48} className="lock-icon" />
                </div>
                <h3>Applicant Tracking System Integration</h3>
                <p>Synchronize and pull candidate pipelines directly from corporate ATS networks.</p>
                
                <div className="ats-logo-row">
                  <div className="logo-card">Greenhouse</div>
                  <div className="logo-card">Lever</div>
                  <div className="logo-card">Workday</div>
                </div>

                <div className="upgrade-prompt-box">
                  <Sparkles size={16} className="upgrade-sparkle" />
                  <span>Enterprise integration required. Contact Org Admin to connect systems.</span>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* TAB: Schedule AI Interviews */
        <div className="sourcing-content-container animate-fade">
          <div className="sourcing-panel card-glass scheduler-panel">
            <div className="scheduler-header">
              <Sparkles size={36} style={{ color: 'var(--color-gold)' }} />
              <h3>Auto-Schedule AI Candidate Interviews</h3>
              <p>Configure screening templates and invite candidates to complete self-paced automated voice assessments.</p>
            </div>

            <div className="scheduler-steps-grid">
              <div className="scheduler-card">
                <div className="step-num">1</div>
                <h4>Generate Invite Link</h4>
                <p>Generate secure, single-use candidate invite codes tied to the Tender Executive listing.</p>
                <button 
                  className="btn-jd-ghost"
                  onClick={() => alert(`Invite Link: http://interviehire.com/careers/${job.customJobId || 'default'}/apply`)}
                >
                  Generate Link
                </button>
              </div>

              <div className="scheduler-card">
                <div className="step-num">2</div>
                <h4>Copy Email Template</h4>
                <p>Get ready-to-send invite outreach email copy pre-filled with workspace tokens.</p>
                <button 
                  className="btn-jd-ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`Hi Candidate,\n\nYou have been shortlisted to interview for the role: ${job.roleName}. Please click this link to start your self-paced assessment.`);
                    alert('Template copied to clipboard!');
                  }}
                >
                  Copy Template
                </button>
              </div>

              <div className="scheduler-card">
                <div className="step-num">3</div>
                <h4>Trigger Automated Mailer</h4>
                <p>Direct our system mail bots to dispatch invites to all candidates currently at the Resume stage.</p>
                <button className="btn-jd-primary" onClick={() => alert('Mailer triggered! Sending invites...')}>
                  Send Emails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
