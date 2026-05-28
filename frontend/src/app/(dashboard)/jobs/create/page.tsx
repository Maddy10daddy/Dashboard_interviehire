'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { 
  Upload, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  HelpCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { soundEngine } from '@/components/SoundEngine';

export default function CreateJobPage() {
  const router = useRouter();
  const { addJob, addApplicant } = useAppContext();

  // Step state: 'upload' | 'edit'
  const [step, setStep] = useState<'upload' | 'edit'>('upload');

  // File states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Loading / Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progressVal, setProgressVal] = useState(0);

  // Extracted Data
  const [roleName, setRoleName] = useState('');
  const [cardName, setCardName] = useState('');
  const [experienceBand, setExperienceBand] = useState('3-6 Years');
  const [customJobId, setCustomJobId] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [functionalQuestions, setFunctionalQuestions] = useState<string[]>([]);

  // AI Prompt space
  const [aiPrompt, setAiPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Seeding toggles
  const [seedResume, setSeedResume] = useState(false);
  const [seedScreening, setSeedScreening] = useState(false);
  const [seedFunctional, setSeedFunctional] = useState(false);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        setSelectedFile(file);
        soundEngine.playChime([329.63], 0.1, 0.05);
      } else {
        alert('Supported Formats are only .pdf and .docx');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Run the Extraction via FastAPI Backend
  const runExtraction = async (fileToUpload: File, promptText?: string) => {
    setIsProcessing(true);
    setProgressVal(15);
    setProcessingStep('Uploading Job Description file...');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (promptText) {
      formData.append('prompt', promptText);
    }

    try {
      // Step 2 delay visual simulation
      setTimeout(() => {
        setProgressVal(50);
        setProcessingStep('Avya AI Requisition Agent: Parsing file text...');
      }, 400);

      setTimeout(() => {
        setProgressVal(80);
        setProcessingStep('Structuring metadata, skills, and screening questions...');
      }, 900);

      const res = await fetch(`${API_URL}/api/jobs/extract-jd`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to extract job description metrics');
      }

      const data = await res.json();
      
      // Update form fields
      setRoleName(data.role_name);
      setCardName(data.card_name);
      setExperienceBand(data.experience_band || '3-6 Years');
      setDescription(data.description);
      setSkills(data.skills);
      setScreeningQuestions(data.screening_questions || []);
      setFunctionalQuestions(data.functional_questions || []);
      
      // Auto-assign customJobId based on filename if blank
      if (!customJobId) {
        const hashPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        setCustomJobId(`REQ-${hashPart}`);
      }

      setProgressVal(100);
      setProcessingStep('Extraction complete!');
      soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);

      setTimeout(() => {
        setStep('edit');
        setIsProcessing(false);
      }, 300);

    } catch (err: any) {
      alert(err.message || 'Error processing file.');
      setIsProcessing(false);
    }
  };

  // Refine using prompt space
  const handleRefine = async () => {
    if (!selectedFile) return;
    setIsRefining(true);
    soundEngine.playChime([392.00, 523.25], 0.1, 0.05);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('prompt', aiPrompt);

    try {
      const res = await fetch(`${API_URL}/api/jobs/extract-jd`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Refinement failed');

      const data = await res.json();
      setRoleName(data.role_name);
      setCardName(data.card_name);
      setExperienceBand(data.experience_band);
      setDescription(data.description);
      setSkills(data.skills);
      setScreeningQuestions(data.screening_questions || []);
      setFunctionalQuestions(data.functional_questions || []);

      soundEngine.playChime([261.63, 329.63, 392.00, 523.25], 0.18, 0.08);
    } catch (err) {
      console.error(err);
      alert('AI Refinement failed. Please check backend logs.');
    } finally {
      setIsRefining(false);
    }
  };

  // Skip upload and populate a default template
  const handleNoFileClick = () => {
    const dummyFile = new File(['Dummy Job Description content for React Senior Developer'], 'Senior_React_Developer.pdf', { type: 'application/pdf' });
    setSelectedFile(dummyFile);
    runExtraction(dummyFile);
  };

  // Final job submission
  const handleCreateJob = async () => {
    if (!roleName || !cardName) {
      alert('Role Name and Card Visual Name are required.');
      return;
    }

    const newJob = {
      id: '',
      roleName,
      cardName,
      created: '',
      status: 'published' as const,
      customJobId: customJobId || '-',
      experienceBand,
      createdBy: 'Devasri',
      pipeline: {
        total: 0,
        resume: 0,
        screening: 0,
        functional: 0
      }
    };

    try {
      const createdJob = await addJob(newJob);
      if (!createdJob) throw new Error('Failed to create job');

      // Seed candidate lists for stages if checked
      const firstNames = ['Lucas', 'Sofia', 'Marcus', 'Chloe', 'Daniel', 'Amina', 'Ryan', 'Evelyn'];
      const lastNames = ['Chen', 'Silva', 'Taylor', 'Nakamura', 'Oki', 'Ali', 'Smith', 'Rana'];
      const seedQueue: Array<{ name: string; email: string; status: 'Resume' | 'Screening' | 'Functional' }> = [];

      const makeCand = (status: 'Resume' | 'Screening' | 'Functional') => {
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const email = `${name.toLowerCase().replace(' ', '.')}@recruit.io`;
        seedQueue.push({ name, email, status });
      };

      if (seedResume) makeCand('Resume');
      if (seedScreening) { makeCand('Screening'); makeCand('Screening'); }
      if (seedFunctional) makeCand('Functional');

      for (const cand of seedQueue) {
        await addApplicant(createdJob.id, {
          name: cand.name,
          email: cand.email,
          phone: '+1 555-0199',
          status: cand.status
        });
      }

      soundEngine.playChime([261.63, 392.00, 523.25], 0.2, 0.08);
      router.push('/jobs');
    } catch (err) {
      console.error(err);
      alert('Error creating job posting.');
    }
  };

  return (
    <section className="dashboard-view active-view" id="view-create-job">
      {/* Breadcrumb Header Bar */}
      <div className="sourcing-header-bar card-glass">
        <div className="sourcing-breadcrumb">
          <span className="crumb" onClick={() => router.push('/jobs')}>Jobs</span>
          <ChevronRight size={14} className="separator" />
          <span className="crumb active">Create Job</span>
        </div>
      </div>

      {step === 'upload' ? (
        <div className="create-job-upload-container animate-fade">
          
          {/* Talk to Avya Requisition Banner */}
          <div className="avya-req-banner card-glass">
            <div className="avya-info">
              <div className="avya-spark-circle">
                <Sparkles size={20} className="spark-icon" />
              </div>
              <div className="avya-text">
                <h3>Avya Requisition: Create a new job by talking to Avya. <span className="duration-tag">10-15 Min</span></h3>
                <p>Avya captures the hiring manager's requirements and automatically creates a structured, AI-powered interview.</p>
              </div>
            </div>
            <button 
              className="btn-jd-primary"
              onClick={handleNoFileClick}
            >
              Start Creation <ArrowRight size={14} />
            </button>
          </div>

          <div className="or-divider-row">
            <div className="line" />
            <span className="text">OR</span>
            <div className="line" />
          </div>

          {/* Drag and Drop Zone */}
          <div className="upload-jd-zone card-glass">
            <h3 className="zone-title">Create by Uploading a Job Description</h3>
            <span className="no-file-link" onClick={handleNoFileClick}>No file? click here</span>

            {isProcessing ? (
              <div className="processing-indicator">
                <RefreshCw className="spinner" size={32} />
                <h3 className="type-h3">{processingStep}</h3>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${progressVal}%` }} />
                </div>
                <span className="pct-val">{progressVal}% Complete</span>
              </div>
            ) : (
              <div 
                className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', marginTop: 20 }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx" 
                  style={{ display: 'none' }} 
                />
                <div className="upload-icon-circle">
                  <Upload size={28} />
                </div>
                <h3>{selectedFile ? selectedFile.name : 'Drag and drop your file here'}</h3>
                <p>Supported Formats: .pdf & .docx</p>
              </div>
            )}

            {!isProcessing && selectedFile && (
              <button 
                className="btn-submit btn-process-trigger" 
                onClick={() => runExtraction(selectedFile)}
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>

        </div>
      ) : (
        /* Step 2: Edit, Refine and Preview Screening Questions */
        <div className="editor-pane-grid animate-fade">
          
          {/* Left Column: Metadata Fields Form */}
          <div className="editor-column card-glass">
            <div className="editor-header">
              <Briefcase size={20} className="color-cyan" />
              <h3>Verify Extracted Metadata</h3>
            </div>
            
            <div className="editor-fields-form">
              <div className="form-group">
                <label>Job Role Name *</label>
                <input 
                  type="text" 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)} 
                  placeholder="e.g. Senior Frontend Architect" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Card Visual Name *</label>
                <input 
                  type="text" 
                  value={cardName} 
                  onChange={(e) => setCardName(e.target.value)} 
                  placeholder="e.g. Next.js Core Lead Developer" 
                  required 
                />
              </div>

              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label>Experience Level</label>
                  <select 
                    value={experienceBand} 
                    onChange={(e) => setExperienceBand(e.target.value)}
                  >
                    <option value="Upto 2 Years">Upto 2 Years</option>
                    <option value="1-4 Years">1-4 Years</option>
                    <option value="3-6 Years">3-6 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Custom Job ID</label>
                  <input 
                    type="text" 
                    value={customJobId} 
                    onChange={(e) => setCustomJobId(e.target.value)} 
                    placeholder="e.g. REQ-981F" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Key Skills Match (Comma separated)</label>
                <input 
                  type="text" 
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)} 
                  placeholder="React, Next.js, TypeScript" 
                />
              </div>

              <div className="form-group">
                <label>Job Description Summary</label>
                <textarea 
                  rows={6} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extracted role description and goals..." 
                />
              </div>

              {/* Candidate Seeding settings */}
              <div className="seed-stages-box">
                <h4>Pipeline Demo Seeds:</h4>
                <div className="seed-options-row">
                  <label className="seed-checkbox">
                    <input 
                      type="checkbox" 
                      checked={seedResume} 
                      onChange={(e) => setSeedResume(e.target.checked)} 
                    />
                    <span>1 Resume stage candidate</span>
                  </label>
                  <label className="seed-checkbox">
                    <input 
                      type="checkbox" 
                      checked={seedScreening} 
                      onChange={(e) => setSeedScreening(e.target.checked)} 
                    />
                    <span>2 Screening stage candidates</span>
                  </label>
                  <label className="seed-checkbox">
                    <input 
                      type="checkbox" 
                      checked={seedFunctional} 
                      onChange={(e) => setSeedFunctional(e.target.checked)} 
                    />
                    <span>1 Functional stage candidate</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Prompt refinement & Question preview */}
          <div className="editor-column card-glass flex-column gap-24">
            
            {/* AI Customizer Prompt space */}
            <div className="prompt-space-box">
              <div className="prompt-header">
                <Sparkles size={18} className="spark-gold" />
                <h4>Instruct Avya AI (Prompt Space)</h4>
              </div>
              <p className="type-caption">Direct the AI model to refine screening rigor, rewrite description targets, or append required skills.</p>
              
              <div className="prompt-input-row">
                <textarea 
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. focus on senior mobile architecture, add Docker and Kubernetes skills, make screening questions much more rigorous."
                />
                <button 
                  className="btn-submit" 
                  disabled={isRefining} 
                  onClick={handleRefine}
                  style={{ alignSelf: 'flex-end', marginTop: 12 }}
                >
                  {isRefining ? (
                    <>
                      <RefreshCw className="spinner" size={14} /> Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} style={{ marginRight: 6 }} /> Refine with AI Sparkles
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI screening questions preview */}
            <div className="questions-preview-box">
              <div className="box-section">
                <h5>🤖 Recruiter Screening Questions (Voice)</h5>
                <ol className="question-list">
                  {screeningQuestions.length > 0 ? (
                    screeningQuestions.map((q, idx) => <li key={idx}>{q}</li>)
                  ) : (
                    <li className="no-data">No screening questions generated.</li>
                  )}
                </ol>
              </div>

              <div className="box-section" style={{ marginTop: 20 }}>
                <h5>💻 Functional Assessment Questions</h5>
                <ol className="question-list">
                  {functionalQuestions.length > 0 ? (
                    functionalQuestions.map((q, idx) => <li key={idx}>{q}</li>)
                  ) : (
                    <li className="no-data">No functional assessment questions generated.</li>
                  )}
                </ol>
              </div>
            </div>

            {/* Form actions */}
            <div className="form-actions-row">
              <button 
                className="btn-jd-ghost" 
                onClick={() => {
                  soundEngine.playChime([392.00, 261.63], 0.1, 0.05);
                  router.push('/jobs');
                }}
              >
                Cancel
              </button>
              <button className="btn-jd-primary" onClick={handleCreateJob}>
                Create Job Posting 🚀
              </button>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}
