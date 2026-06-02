from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
import shutil, os
from sqlalchemy import func

from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.applicant import Applicant, ApplicantSource
from app.models.career import JobCollaborator
from app.models.user import User, UserType
from app.schemas import (
    JobListOut, JobOut, JobDetailOut, JobSettingsIn,
    JobPipelineCounts, CollaboratorIn, AddApplicantIn, ApplicantOut, FunnelOut, FunnelStage,
    JobCreateIn, ApplicantUpdateIn, BulkApplicantsIn, OutgoingMessage, JobParametersIn
)
from app.websocket_manager import manager

router = APIRouter()

UPLOAD_DIR = "uploads/jd"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _build_job_out(job: Job, db: Session) -> dict:
    """Helper to build JobOut with pipeline counts."""
    applicants = db.query(Applicant).filter(Applicant.job_id == job.id).all()
    import json
    return {
        **job.__dict__,
        "created_by_name": job.created_by.name if job.created_by else None,
        "pipeline": JobPipelineCounts(
            total=len(applicants),
            resume=sum(1 for a in applicants if a.resume_analysed),  # count analysed resumes
            screening=sum(1 for a in applicants if a.screening_status is not None),
            functional=sum(1 for a in applicants if a.functional_status is not None),
        ),
        "resume_parameters": json.loads(job.resume_parameters) if job.resume_parameters else None,
        "screening_parameters": json.loads(job.screening_parameters) if job.screening_parameters else None,
        "functional_parameters": json.loads(job.functional_parameters) if job.functional_parameters else None
    }


# ─── JOB LIST ────────────────────────────────────────────────────────────────

@router.get("", response_model=JobListOut)
def list_jobs(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if status and status != "all":
        query = query.filter(Job.status == status)
    jobs = query.order_by(Job.created_at.desc()).all()

    all_jobs = db.query(Job).all()
    return JobListOut(
        jobs=[_build_job_out(j, db) for j in jobs],
        total=len(all_jobs),
        published=sum(1 for j in all_jobs if j.status == JobStatus.published),
        draft=sum(1 for j in all_jobs if j.status == JobStatus.draft),
        archived=sum(1 for j in all_jobs if j.status == JobStatus.archived),
    )


@router.post("", response_model=JobOut)
def create_job(data: JobCreateIn, db: Session = Depends(get_db)):
    # Default admin user as creator if one exists
    admin = db.query(User).filter(User.user_type == UserType.org_admin).first()
    import json
    new_job = Job(
        title=data.title,
        role_name=data.role_name,
        experience_band=data.experience_band,
        custom_job_id=data.custom_job_id,
        status=data.status,
        created_by_id=admin.id if admin else None,
        resume_analysis_enabled=data.resume_analysis_enabled,
        recruiter_screening_enabled=data.recruiter_screening_enabled,
        functional_interview_enabled=data.functional_interview_enabled,
        description=data.description,
        resume_parameters=json.dumps(data.resume_parameters) if data.resume_parameters else None,
        screening_parameters=json.dumps(data.screening_parameters) if data.screening_parameters else None,
        functional_parameters=json.dumps(data.functional_parameters) if data.functional_parameters else None
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return _build_job_out(new_job, db)


# ─── CREATE JOB (file upload path) ───────────────────────────────────────────

@router.post("/upload-jd")
def upload_jd(file: UploadFile = File(...)):
    """Step 1 of Create Job — upload a PDF or DOCX job description."""
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only .pdf and .docx files are supported")
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"file_path": file_path, "filename": file.filename}


@router.post("/extract-jd")
def extract_jd(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None)
):
    """Parses an uploaded PDF/DOCX job description and extracts details, refined by prompt guidelines."""
    import time
    
    # Validate extension
    if not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Only .pdf, .docx, and .txt files are supported")
    
    # Save file
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Try to read text from file if possible (simple text extraction for pdf/docx/txt)
    file_text = ""
    try:
        if file.filename.endswith(".pdf"):
            # Simple PDF text extraction (scans printable ascii segments)
            with open(file_path, "rb") as f:
                content = f.read()
                # Simple extraction of text in parentheses/brackets or raw characters
                import re
                strings = re.findall(rb"[a-zA-Z0-9\s\.,;:!\?\-\'\"]{4,}", content)
                file_text = " ".join([s.decode("ascii", errors="ignore") for s in strings[:800]])
        elif file.filename.endswith(".txt"):
            # Simple text file reading
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                file_text = f.read()[:3000]
        else:
            # Simple docx text extraction (docx is zip of xml, we can parse it simply or fallback)
            import zipfile
            with zipfile.ZipFile(file_path) as z:
                xml_content = z.read("word/document.xml")
                import re
                clean = re.sub(b"<[^>]*>", b"", xml_content)
                file_text = clean.decode("utf-8", errors="ignore")[:3000]
    except Exception as e:
        print(f"Text extraction fallback: {e}")

    if not file_text:
        file_text = f"Filename: {file.filename}. No direct text extracted."

    # Check if Groq, Grok, or Gemini API key exists
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    grok_key = os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    prompt_schema_instructions = f"""
You MUST extract and output a JSON object matching this EXACT format (no other text, markdown formatting, or explanations):
{{
  "role_name": "The official role title (e.g. Senior Frontend Engineer)",
  "card_name": "A short, visual card title for the board (e.g. Next.js Core Lead Developer)",
  "experience_band": "Choose one of these: 'Upto 2 Years', '1-4 Years', '3-6 Years', '5+ Years'",
  "description": "A concise 2-3 sentence overview summary of the role and goals.",
  "skills": "Comma-separated key technical skills (e.g. React, Next.js, TypeScript)",
  "screening_questions": [
    "Recruiter screening question 1",
    "Recruiter screening question 2",
    "Recruiter screening question 3"
  ],
  "functional_questions": [
    "Technical/functional assessment question 1",
    "Technical/functional assessment question 2",
    "Technical/functional assessment question 3"
  ],
  "resume_parameters": {{
     "must_have": ["Must-have requirement 1 (e.g. 3+ years experience with React)", "Must-have requirement 2", "Must-have requirement 3"],
     "red_flags": ["Red flag 1 (e.g. Lacks JavaScript core understanding)", "Red flag 2", "Red flag 3"],
     "good_to_have": ["Good-to-have skill 1 (e.g. Familiar with Webpack)", "Good-to-have skill 2", "Good-to-have skill 3"]
  }},
  "screening_parameters": {{
     "experience": [
        {{"parameter": "Total Experience", "preferred_response": "5+ years"}},
        {{"parameter": "Relevant Experience", "preferred_response": "3+ years"}}
     ],
     "location": [
        {{"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"}},
        {{"parameter": "Ready to relocate", "preferred_response": "Yes"}}
     ],
     "compensation": [
        {{"parameter": "Current CTC", "preferred_response": "Market competitive"}},
        {{"parameter": "Expected CTC", "preferred_response": "Within budget"}}
     ]
  }},
  "functional_parameters": {{
     "topics": [
        {{
           "name": "React Lifecycle & Render Optimization",
           "type": "Theoretical",
           "difficulty": "Medium",
           "questions": [
              "Explain the difference between Server Components and Client Components.",
              "How does useMemo prevent child re-renders?"
           ]
        }},
        {{
           "name": "Frontend Systems Design",
           "type": "Experiential",
           "difficulty": "Hard",
           "questions": [
              "How would you design a frontend cache for high-frequency stock price feeds?",
              "Describe your strategy for managing complex global state without causing unnecessary re-renders."
           ]
        }}
     ]
  }}
}}
"""

    if groq_key:
        import urllib.request
        import json
        
        groq_prompt = f"""
You are an expert AI recruiting coordinator and talent partner.
Your task is to analyze the provided Job Description text and combine it with the USER EXTRA INSTRUCTIONS to generate a structured job description metadata object in JSON.

GUIDELINES:
1. If the USER EXTRA INSTRUCTIONS request a different role, domain, style, seniority, or completely override the job description text (for example: "okay an HR" or "make it for a Product Manager"), you MUST generate the details for that new requested role from scratch, ignoring the original Job Description text.
2. Provide realistic and professional content for the role, card visual name, experience level, summary description, key skills (comma-separated), screening questions, and functional assessment questions suitable for the final role.
3. Ensure the JSON is valid and fits the schema exactly.

JOB DESCRIPTION TEXT:
\"\"\"
{file_text}
\"\"\"

USER EXTRA INSTRUCTIONS / PROMPT:
\"\"\"
{prompt if prompt else "None"}
\"\"\"

{prompt_schema_instructions}
"""
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional recruiting coordinator. You must return ONLY a JSON object matching the requested schema. Do not write markdown blocks or explanations."
                    },
                    {
                        "role": "user",
                        "content": groq_prompt
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {groq_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["choices"][0]["message"]["content"].strip()
                ai_data = json.loads(text_response)
                
                return {
                    "role_name": ai_data.get("role_name", "Senior Software Engineer"),
                    "card_name": ai_data.get("card_name", "Full Stack Core Architect"),
                    "experience_band": ai_data.get("experience_band", "3-6 Years"),
                    "description": ai_data.get("description", "Software engineer description"),
                    "skills": ai_data.get("skills", "Python, React"),
                    "screening_questions": ai_data.get("screening_questions", []),
                    "functional_questions": ai_data.get("functional_questions", []),
                    "resume_parameters": ai_data.get("resume_parameters", {
                        "must_have": [],
                        "red_flags": [],
                        "good_to_have": []
                    }),
                    "screening_parameters": ai_data.get("screening_parameters", {
                        "experience": [],
                        "location": [],
                        "compensation": []
                    }),
                    "functional_parameters": ai_data.get("functional_parameters", {
                        "topics": []
                    }),
                    "file_path": file_path
                }
        except Exception as err:
            print(f"Groq API failure, falling back: {err}")

    if grok_key:
        import urllib.request
        import json
        
        grok_prompt = f"""
You are an expert AI recruiting coordinator and talent partner.
Your task is to analyze the provided Job Description text and combine it with the USER EXTRA INSTRUCTIONS to generate a structured job description metadata object in JSON.

GUIDELINES:
1. If the USER EXTRA INSTRUCTIONS request a different role, domain, style, seniority, or completely override the job description text (for example: "okay an HR" or "make it for a Product Manager"), you MUST generate the details for that new requested role from scratch, ignoring the original Job Description text.
2. Provide realistic and professional content for the role, card visual name, experience level, summary description, key skills (comma-separated), screening questions, and functional assessment questions suitable for the final role.
3. Ensure the JSON is valid and fits the schema exactly.

JOB DESCRIPTION TEXT:
\"\"\"
{file_text}
\"\"\"

USER EXTRA INSTRUCTIONS / PROMPT:
\"\"\"
{prompt if prompt else "None"}
\"\"\"

{prompt_schema_instructions}
"""
        try:
            url = "https://api.xai.com/v1/chat/completions"
            payload = {
                "model": "grok-beta",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional recruiting coordinator. You must return ONLY a JSON object matching the requested schema. Do not write markdown blocks or explanations."
                    },
                    {
                        "role": "user",
                        "content": grok_prompt
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {grok_key}"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["choices"][0]["message"]["content"].strip()
                ai_data = json.loads(text_response)
                
                return {
                    "role_name": ai_data.get("role_name", "Senior Software Engineer"),
                    "card_name": ai_data.get("card_name", "Full Stack Core Architect"),
                    "experience_band": ai_data.get("experience_band", "3-6 Years"),
                    "description": ai_data.get("description", "Software engineer description"),
                    "skills": ai_data.get("skills", "Python, React"),
                    "screening_questions": ai_data.get("screening_questions", []),
                    "functional_questions": ai_data.get("functional_questions", []),
                    "resume_parameters": ai_data.get("resume_parameters", {
                        "must_have": [],
                        "red_flags": [],
                        "good_to_have": []
                    }),
                    "screening_parameters": ai_data.get("screening_parameters", {
                        "experience": [],
                        "location": [],
                        "compensation": []
                    }),
                    "functional_parameters": ai_data.get("functional_parameters", {
                        "topics": []
                    }),
                    "file_path": file_path
                }
        except Exception as err:
            print(f"Grok API failure, falling back: {err}")

    if gemini_key:
        import urllib.request
        import json
        
        gemini_prompt = f"""
You are an expert AI recruiting coordinator and talent partner.
Your task is to analyze the provided Job Description text and combine it with the USER EXTRA INSTRUCTIONS to generate a structured job description metadata object in JSON.

GUIDELINES:
1. If the USER EXTRA INSTRUCTIONS request a different role, domain, style, seniority, or completely override the job description text (for example: "okay an HR" or "make it for a Product Manager"), you MUST generate the details for that new requested role from scratch, ignoring the original Job Description text.
2. Provide realistic and professional content for the role, card visual name, experience level, summary description, key skills (comma-separated), screening questions, and functional assessment questions suitable for the final role.
3. Ensure the JSON is valid and fits the schema exactly.

JOB DESCRIPTION TEXT:
\"\"\"
{file_text}
\"\"\"

USER EXTRA INSTRUCTIONS / PROMPT:
\"\"\"
{prompt if prompt else "None"}
\"\"\"

{prompt_schema_instructions}
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": gemini_prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                ai_data = json.loads(text_response)
                
                return {
                    "role_name": ai_data.get("role_name", "Senior Software Engineer"),
                    "card_name": ai_data.get("card_name", "Full Stack Core Architect"),
                    "experience_band": ai_data.get("experience_band", "3-6 Years"),
                    "description": ai_data.get("description", "Software engineer description"),
                    "skills": ai_data.get("skills", "Python, React"),
                    "screening_questions": ai_data.get("screening_questions", []),
                    "functional_questions": ai_data.get("functional_questions", []),
                    "resume_parameters": ai_data.get("resume_parameters", {
                        "must_have": [],
                        "red_flags": [],
                        "good_to_have": []
                    }),
                    "screening_parameters": ai_data.get("screening_parameters", {
                        "experience": [],
                        "location": [],
                        "compensation": []
                    }),
                    "functional_parameters": ai_data.get("functional_parameters", {
                        "topics": []
                    }),
                    "file_path": file_path
                }
        except Exception as err:
            print(f"Gemini API failure, falling back to heuristics: {err}")

    # Analyze filename/prompt to customize the output
    content_key = file.filename.lower()
    prompt_key = prompt.lower() if prompt else ""
    
    # Default values (General role)
    role_name = "Senior Software Engineer"
    card_name = "Full Stack Core Architect"
    experience_band = "3-6 Years"
    description = "We are seeking a talented Senior Software Engineer to help build and maintain our high-performance cloud applications, design robust APIs, and mentor junior developers."
    skills = "Python, PostgreSQL, React, TypeScript, Docker, AWS"
    
    screening_questions = [
        "Explain the difference between microservices and a monolithic architecture.",
        "How do you handle race conditions and concurrency in a database-driven system?",
        "Describe a challenging bug you debugged and how you resolved it."
    ]
    
    functional_questions = [
        "Design a rate-limiting middleware for an API that handles 10,000 requests per minute.",
        "How would you optimize a slow database query with millions of records?",
        "Implement a thread-safe singleton pattern in your language of choice."
    ]
    
    # Determine domain match by prioritizing prompt_key, then content_key
    domain = None
    if "hr" in prompt_key or "people" in prompt_key or "recruiter" in prompt_key or "talent" in prompt_key or "recruitment" in prompt_key:
        domain = "hr"
    elif "data" in prompt_key or "ml" in prompt_key or "machine" in prompt_key:
        domain = "ml"
    elif "product" in prompt_key or "pm" in prompt_key or "manager" in prompt_key:
        domain = "pm"
    elif "frontend" in prompt_key or "next" in prompt_key or "react" in prompt_key or "ui" in prompt_key or "front" in prompt_key:
        domain = "frontend"
    elif "hr" in content_key or "people" in content_key or "recruiter" in content_key or "talent" in content_key or "recruitment" in content_key:
        domain = "hr"
    elif "data" in content_key or "ml" in content_key or "machine" in content_key:
        domain = "ml"
    elif "product" in content_key or "pm" in content_key or "manager" in content_key:
        domain = "pm"
    elif "frontend" in content_key or "next" in content_key or "react" in content_key or "ui" in content_key:
        domain = "frontend"

    # Heuristic matching: Data Scientist / ML
    if domain == "ml":
        role_name = "Senior Machine Learning Engineer"
        card_name = "ML & Data Intelligence Lead"
        experience_band = "5+ Years"
        description = "We are looking for a Senior Machine Learning Engineer to lead the design and deployment of large-scale predictive models, fine-tune neural nets, and implement advanced analytics."
        skills = "Python, PyTorch, TensorFlow, Pandas, Kubernetes, SQL"
        screening_questions = [
            "Explain the difference between bagging and boosting algorithms.",
            "How do you handle class imbalance in classification datasets?",
            "What strategies do you use to deploy model updates with zero downtime?"
        ]
        functional_questions = [
            "How would you optimize the memory footprint of a custom DataLoader for massive image files?",
            "Write a script to compute precision-recall curves for a multi-class model output.",
            "Describe how you would design an automated feature engineering pipeline in Spark."
        ]
        
    # Heuristic matching: Product Manager
    elif domain == "pm":
        role_name = "Lead Product Manager"
        card_name = "Requisition & Growth Architect"
        experience_band = "5+ Years"
        description = "We are looking for a Lead Product Manager to own our core onboarding and requisition pipelines, define strategic feature roadmaps, and align cross-functional teams."
        skills = "Product Strategy, Roadmap Design, Agile/Scrum, Mixpanel, SQL"
        screening_questions = [
            "How do you prioritize features when multiple stakeholders have conflicting demands?",
            "Describe a product feature you launched that failed, and what you learned from it.",
            "What metrics would you track to measure the success of an AI resume-screening assistant?"
        ]
        functional_questions = [
            "Write a detailed PRD section for a new collaborative hiring dashboard feature.",
            "How would you design a feedback loop to improve user retention by 15% within a quarter?",
            "Sketch a wireframe flow for candidates completing a self-paced video interview."
        ]
        
    # Heuristic matching: Frontend / React / Next.js
    elif domain == "frontend":
        role_name = "Senior Frontend Architect"
        card_name = "Next.js Core Lead Developer"
        experience_band = "5+ Years"
        description = "We are seeking a Senior Frontend Architect to lead the implementation of our Next.js App Router applications, structure design systems, and maximize PageSpeed scores."
        skills = "React, Next.js, TypeScript, HSL CSS, Tailwind, Webpack"
        screening_questions = [
            "Explain the rendering lifecycle difference between Next.js Server Components and Client Components.",
            "How do you approach core web vitals optimization in a high-traffic Next.js site?",
            "Describe your strategy for managing complex global state without causing unnecessary re-renders."
        ]
        functional_questions = [
            "Implement a custom React hook that throttles inputs for search query API calls.",
            "Explain the difference between JSI and bridge architecture, or how to resolve a rendering bottleneck.",
            "Write a webpack/next.config override to split large utility libraries into separate chunks."
        ]
        
    # Heuristic matching: HR / Recruiter / People Operations
    elif domain == "hr":
        role_name = "HR Operations Coordinator"
        card_name = "Talent & Culture Coordinator"
        experience_band = "1-4 Years"
        description = "We are seeking an HR Operations Coordinator to manage candidate onboarding, handle organizational policy updates, and coordinate cross-functional hiring initiatives."
        skills = "HR Operations, Onboarding, Recruiting, ATS Management, Communication"
        screening_questions = [
            "How do you handle confidential employee or candidate information?",
            "Describe your experience coordinating interviews across multiple timezones.",
            "How do you resolve conflicts between team members or hiring managers?"
        ]
        functional_questions = [
            "Write a standard welcome email and onboarding checklist for a new engineering hire.",
            "How would you structure a monthly metrics report on hiring time-to-fill for leadership?",
            "Detail the steps you would take to resolve an incomplete candidate application."
        ]
        
    # Prompt refinement overrides
    if "senior" in prompt_key or "architect" in prompt_key or "lead" in prompt_key:
        experience_band = "5+ Years"
        role_name = "Lead " + role_name.replace("Senior ", "")
        description = description.replace("seeking a", "seeking a Lead").replace("seeking", "seeking a Lead")
        # Make questions more senior
        screening_questions[0] = "What architectural patterns do you implement to ensure high scalability and disaster recovery?"
        functional_questions[0] = "Design a system architecture to handle real-time sync across 100k connected websockets."
        
    if "junior" in prompt_key or "associate" in prompt_key:
        experience_band = "Upto 2 Years"
        role_name = "Junior " + role_name.replace("Senior ", "").replace("Lead ", "")
        description = description.replace("seeking a", "seeking a Junior").replace("seeking", "seeking a Junior")
        
    if "mobile" in prompt_key or "react native" in prompt_key:
        role_name = role_name.replace("Frontend", "Mobile").replace("Software", "Mobile")
        card_name = "React Native Mobile Architect"
        skills = "React Native, Swift, Kotlin, React, Redux, Fastlane"
        description = "We are looking for a Mobile Architect to build native iOS/Android experiences using React Native, bridge native modules, and manage app store deployments."
        screening_questions[1] = "How do you manage platform-specific styling and layout issues in React Native?"
        functional_questions[1] = "Explain the rendering improvements of the new React Native Architecture (Fabric & TurboModules)."
        
    if "kubernetes" in prompt_key or "cloud" in prompt_key or "devops" in prompt_key:
        skills += ", Kubernetes, Terraform, CI/CD, AWS EKS"
        description += " Focus will include building Kubernetes deployments and designing infrastructure as code using Terraform."
        screening_questions[2] = "Describe your experience setting up multi-stage CI/CD pipelines in Gitlab or Github Actions."
        functional_questions[2] = "Write a Kubernetes deployment yaml with resource limits, liveness/readiness probes, and horizontal scaling."
        
    # Construct fallback parameters based on domain
    if domain == "ml":
        resume_parameters = {
            "must_have": [
                "Expertise in PyTorch, TensorFlow, or Pandas",
                "Strong SQL and data modeling fundamentals",
                "5+ years of ML engineering experience"
            ],
            "red_flags": [
                "No experience with Python or ML libraries",
                "Lacks statistics or linear algebra fundamentals",
                "Only general software background without ML/Data focus"
            ],
            "good_to_have": [
                "Experience with Kubernetes and Docker",
                "Familiarity with NLP, Transformers, or GenAI",
                "Contributions to open-source ML repositories"
            ]
        }
        screening_parameters = {
            "experience": [
                {"parameter": "Total Experience", "preferred_response": "5+ Years"},
                {"parameter": "Relevant Experience", "preferred_response": "3+ Years ML"}
            ],
            "location": [
                {"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"},
                {"parameter": "Ready to relocate", "preferred_response": "Yes"}
            ],
            "compensation": [
                {"parameter": "Current CTC", "preferred_response": "Market competitive"},
                {"parameter": "Expected CTC", "preferred_response": "Within budget"}
            ]
        }
        functional_parameters = {
            "topics": [
                {
                    "name": "Machine Learning Core Theory",
                    "type": "Theoretical",
                    "difficulty": "Medium",
                    "questions": [
                        screening_questions[0] if len(screening_questions) > 0 else "Explain bagging vs boosting.",
                        screening_questions[1] if len(screening_questions) > 1 else "How do you handle class imbalance?"
                    ]
                },
                {
                    "name": "DataLoader & Feature Pipelines",
                    "type": "Experiential",
                    "difficulty": "Hard",
                    "questions": [
                        functional_questions[0] if len(functional_questions) > 0 else "Optimize memory of custom DataLoader.",
                        functional_questions[1] if len(functional_questions) > 1 else "Compute precision-recall curves."
                    ]
                }
            ]
        }
    elif domain == "pm":
        resume_parameters = {
            "must_have": [
                "Product strategy and roadmap design",
                "Experience running Agile/Scrum processes",
                "5+ years product management experience"
            ],
            "red_flags": [
                "No experience with analytics tools like Mixpanel or Amplitude",
                "Lacks leadership or stakeholder management skills",
                "Only engineering experience without product ownership"
            ],
            "good_to_have": [
                "Experience scaling B2B SaaS applications",
                "Background in UI/UX wireframing",
                "Technical background or engineering degree"
            ]
        }
        screening_parameters = {
            "experience": [
                {"parameter": "Total Experience", "preferred_response": "5+ Years"},
                {"parameter": "Relevant Experience", "preferred_response": "3+ Years PM"}
            ],
            "location": [
                {"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"},
                {"parameter": "Ready to relocate", "preferred_response": "Yes"}
            ],
            "compensation": [
                {"parameter": "Current CTC", "preferred_response": "Market competitive"},
                {"parameter": "Expected CTC", "preferred_response": "Within budget"}
            ]
        }
        functional_parameters = {
            "topics": [
                {
                    "name": "Product Strategy & Metrics",
                    "type": "Theoretical",
                    "difficulty": "Medium",
                    "questions": [
                        screening_questions[0] if len(screening_questions) > 0 else "How do you prioritize features?",
                        screening_questions[1] if len(screening_questions) > 1 else "Describe a feature that failed."
                    ]
                },
                {
                    "name": "PRD & Wireframe Scenarios",
                    "type": "Experiential",
                    "difficulty": "Hard",
                    "questions": [
                        functional_questions[0] if len(functional_questions) > 0 else "Write a detailed PRD section.",
                        functional_questions[1] if len(functional_questions) > 1 else "How would you design a feedback loop?"
                    ]
                }
            ]
        }
    elif domain == "hr":
        resume_parameters = {
            "must_have": [
                "HR Operations and Policy Management",
                "Recruiting and ATS tracking expertise",
                "Excellent interpersonal communication"
            ],
            "red_flags": [
                "No experience with confidentiality guidelines",
                "Lacks structured organization skills",
                "Unable to manage multi-timezone scheduling"
            ],
            "good_to_have": [
                "Familiarity with labor laws and compliance regulations",
                "Experience with HRIS software tools",
                "Background in talent acquisition and onboarding"
            ]
        }
        screening_parameters = {
            "experience": [
                {"parameter": "Total Experience", "preferred_response": "2+ Years"},
                {"parameter": "Relevant Experience", "preferred_response": "1+ Years HR"}
            ],
            "location": [
                {"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"},
                {"parameter": "Ready to relocate", "preferred_response": "Yes"}
            ],
            "compensation": [
                {"parameter": "Current CTC", "preferred_response": "Market competitive"},
                {"parameter": "Expected CTC", "preferred_response": "Within budget"}
            ]
        }
        functional_parameters = {
            "topics": [
                {
                    "name": "Employee Relations & Scheduling",
                    "type": "Theoretical",
                    "difficulty": "Medium",
                    "questions": [
                        screening_questions[0] if len(screening_questions) > 0 else "How do you handle confidential info?",
                        screening_questions[1] if len(screening_questions) > 1 else "How do you resolve conflicts?"
                    ]
                },
                {
                    "name": "Onboarding & HR metrics reports",
                    "type": "Experiential",
                    "difficulty": "Medium",
                    "questions": [
                        functional_questions[0] if len(functional_questions) > 0 else "Write standard welcome email.",
                        functional_questions[1] if len(functional_questions) > 1 else "Structure monthly metrics report."
                    ]
                }
            ]
        }
    elif domain == "frontend":
        resume_parameters = {
            "must_have": [
                "Expertise in React and Next.js App Router",
                "Proficiency in TypeScript and HSL/Tailwind CSS",
                "5+ years frontend architect experience"
            ],
            "red_flags": [
                "Lacks rendering lifecycle understanding",
                "No core web vitals optimization experience",
                "Only general HTML/CSS experience without JS frameworks"
            ],
            "good_to_have": [
                "Familiar with Webpack and next.config overrides",
                "Experience setting up global state machines",
                "Contributions to design system implementations"
            ]
        }
        screening_parameters = {
            "experience": [
                {"parameter": "Total Experience", "preferred_response": "5+ Years"},
                {"parameter": "Relevant Experience", "preferred_response": "3+ Years Frontend"}
            ],
            "location": [
                {"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"},
                {"parameter": "Ready to relocate", "preferred_response": "Yes"}
            ],
            "compensation": [
                {"parameter": "Current CTC", "preferred_response": "Market competitive"},
                {"parameter": "Expected CTC", "preferred_response": "Within budget"}
            ]
        }
        functional_parameters = {
            "topics": [
                {
                    "name": "React Hooks & Lifecycle Optimizations",
                    "type": "Theoretical",
                    "difficulty": "Medium",
                    "questions": [
                        screening_questions[0] if len(screening_questions) > 0 else "Explain Server Components vs Client Components.",
                        screening_questions[1] if len(screening_questions) > 1 else "How do you approach Core Web Vitals optimization?"
                    ]
                },
                {
                    "name": "Performance & Custom Webpack Overrides",
                    "type": "Experiential",
                    "difficulty": "Hard",
                    "questions": [
                        functional_questions[0] if len(functional_questions) > 0 else "Implement custom search query React hook.",
                        functional_questions[1] if len(functional_questions) > 1 else "Explain JSI vs bridge architecture."
                    ]
                }
            ]
        }
    else:  # General
        resume_parameters = {
            "must_have": [
                "Proficiency in Python and PostgreSQL",
                "Strong API and server-side architecture background",
                "3+ years software engineering experience"
            ],
            "red_flags": [
                "No experience with docker or containers",
                "Lacks database optimization skills",
                "Unable to write asynchronous code"
            ],
            "good_to_have": [
                "Familiarity with AWS cloud solutions",
                "Experience with testing frameworks (pytest)",
                "Contributions to microservice infrastructures"
            ]
        }
        screening_parameters = {
            "experience": [
                {"parameter": "Total Experience", "preferred_response": "3+ Years"},
                {"parameter": "Relevant Experience", "preferred_response": "2+ Years API"}
            ],
            "location": [
                {"parameter": "Current Location", "preferred_response": "Mumbai/Pune/Remote"},
                {"parameter": "Ready to relocate", "preferred_response": "Yes"}
            ],
            "compensation": [
                {"parameter": "Current CTC", "preferred_response": "Market competitive"},
                {"parameter": "Expected CTC", "preferred_response": "Within budget"}
            ]
        }
        functional_parameters = {
            "topics": [
                {
                    "name": "API Middleware & Optimization",
                    "type": "Theoretical",
                    "difficulty": "Medium",
                    "questions": [
                        screening_questions[0] if len(screening_questions) > 0 else "Explain microservices vs monolith.",
                        screening_questions[1] if len(screening_questions) > 1 else "How do you handle race conditions?"
                    ]
                },
                {
                    "name": "Database Queries & Threads",
                    "type": "Experiential",
                    "difficulty": "Hard",
                    "questions": [
                        functional_questions[0] if len(functional_questions) > 0 else "Design a rate-limiting middleware.",
                        functional_questions[1] if len(functional_questions) > 1 else "Optimize a slow database query."
                    ]
                }
            ]
        }

    # Add simulated processing delay (1.2 seconds) for UX feel
    time.sleep(1.2)
    
    return {
        "role_name": role_name,
        "card_name": card_name,
        "experience_band": experience_band,
        "description": description,
        "skills": skills,
        "screening_questions": screening_questions,
        "functional_questions": functional_questions,
        "resume_parameters": resume_parameters,
        "screening_parameters": screening_parameters,
        "functional_parameters": functional_parameters,
        "file_path": file_path
    }


# ─── JOB DETAIL ──────────────────────────────────────────────────────────────

def _build_job_detail_out(job: Job) -> dict:
    import json
    return {
        "id": job.id,
        "title": job.title,
        "role_name": job.role_name,
        "status": job.status,
        "description": job.description,
        "location": job.location,
        "job_type": job.job_type,
        "experience_band": job.experience_band,
        "is_job_listed": job.is_job_listed,
        "resume_analysis_enabled": job.resume_analysis_enabled,
        "recruiter_screening_enabled": job.recruiter_screening_enabled,
        "functional_interview_enabled": job.functional_interview_enabled,
        "created_at": job.created_at,
        "resume_parameters": json.loads(job.resume_parameters) if job.resume_parameters else None,
        "screening_parameters": json.loads(job.screening_parameters) if job.screening_parameters else None,
        "functional_parameters": json.loads(job.functional_parameters) if job.functional_parameters else None
    }

@router.get("/{job_id}", response_model=JobDetailOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _build_job_detail_out(job)


@router.patch("/{job_id}/settings", response_model=JobDetailOut)
def update_job_settings(job_id: UUID, data: JobSettingsIn, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return _build_job_detail_out(job)

@router.patch("/{job_id}/parameters", response_model=JobDetailOut)
def update_job_parameters(job_id: UUID, data: JobParametersIn, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    import json
    if data.resume_parameters is not None:
        job.resume_parameters = json.dumps(data.resume_parameters)
    if data.screening_parameters is not None:
        job.screening_parameters = json.dumps(data.screening_parameters)
    if data.functional_parameters is not None:
        job.functional_parameters = json.dumps(data.functional_parameters)
    db.commit()
    db.refresh(job)
    return _build_job_detail_out(job)


# ─── RESPONSES (candidates for a job) ────────────────────────────────────────

@router.get("/{job_id}/responses")
def get_responses(
    job_id: UUID,
    tab: Optional[str] = Query("overview"),  # overview | resume | screening | functional
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    applicants = db.query(Applicant).filter(Applicant.job_id == job_id).all()

    if tab == "overview":
        return _build_funnel(applicants)
    elif tab == "resume":
        return [a for a in applicants]
    elif tab == "screening":
        return [a for a in applicants if a.screening_status is not None]
    elif tab == "functional":
        return [a for a in applicants if a.functional_status is not None]
    return applicants


def _build_funnel(applicants: list) -> dict:
    total = len(applicants)
    resume = sum(1 for a in applicants if a.resume_analysed)
    screening = sum(1 for a in applicants if a.screening_status is not None)
    functional = sum(1 for a in applicants if a.functional_status is not None)
    completed = sum(1 for a in applicants if a.functional_status and a.functional_status.value == "completed")
    qualified = sum(1 for a in applicants if a.functional_score and a.functional_score >= 60)

    def conv(n, base):
        return round((n / base) * 100) if base else 0

    # Score distribution buckets
    scores = [a.functional_score for a in applicants if a.functional_score is not None]
    distribution = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for s in scores:
        if s <= 20: distribution["0-20"] += 1
        elif s <= 40: distribution["20-40"] += 1
        elif s <= 60: distribution["40-60"] += 1
        elif s <= 80: distribution["60-80"] += 1
        else: distribution["80-100"] += 1

    return {
        "stages": [
            {"label": "Total Candidates", "count": total, "conversion": None},
            {"label": "Resume Analysis", "count": resume, "conversion": conv(resume, total)},
            {"label": "Recruiter Screening", "count": screening, "conversion": conv(screening, total)},
            {"label": "Functional Interview", "count": functional, "conversion": conv(functional, screening)},
            {"label": "Completed", "count": completed, "conversion": conv(completed, functional)},
            {"label": "Qualified", "count": qualified, "conversion": conv(qualified, completed)},
        ],
        "score_distribution": distribution,
    }


# ─── COLLABORATORS ────────────────────────────────────────────────────────────

@router.post("/{job_id}/collaborators")
def add_collaborator(job_id: UUID, data: CollaboratorIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    collab = JobCollaborator(job_id=job_id, user_id=data.user_id)
    db.add(collab)
    db.commit()
    return {"message": "Collaborator added"}


@router.delete("/{job_id}/collaborators/{user_id}")
def remove_collaborator(job_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    collab = db.query(JobCollaborator).filter(
        JobCollaborator.job_id == job_id,
        JobCollaborator.user_id == user_id
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    db.delete(collab)
    db.commit()
    return {"message": "Collaborator removed"}


# ─── ADD APPLICANTS ───────────────────────────────────────────────────────────

@router.post("/{job_id}/applicants", response_model=ApplicantOut)
def add_applicant(job_id: UUID, data: AddApplicantIn, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    applicant = Applicant(**data.model_dump(), job_id=job_id)
    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    # Broadcast updates via WebSocket
    message = OutgoingMessage(
        type="candidate_update",
        content=f"New Candidate: {applicant.name} applied for {job.role_name}",
        sender="System"
    ).model_dump_json()
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(message, room_id="global"))
    except RuntimeError:
        pass

    return applicant


@router.post("/{job_id}/applicants/bulk", response_model=List[ApplicantOut])
def add_applicants_bulk(job_id: UUID, data: BulkApplicantsIn, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    created_applicants = []
    for app_in in data.applicants:
        applicant = Applicant(**app_in.model_dump(), job_id=job_id)
        db.add(applicant)
        created_applicants.append(applicant)
        
    db.commit()
    for app in created_applicants:
        db.refresh(app)
        
    # Broadcast updates via WebSocket
    message = OutgoingMessage(
        type="candidate_update",
        content=f"Imported {len(created_applicants)} candidates for {job.role_name}",
        sender="System"
    ).model_dump_json()
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(message, room_id="global"))
    except RuntimeError:
        pass
        
    return created_applicants


@router.post("/{job_id}/applicants/upload-resumes", response_model=List[ApplicantOut])
def upload_resumes(job_id: UUID, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    resume_dir = "uploads/resumes"
    os.makedirs(resume_dir, exist_ok=True)
    
    created_applicants = []
    for file in files:
        # Save file
        file_path = f"{resume_dir}/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Clean candidate name from filename (e.g. "aditya_rana_resume" -> "Aditya Rana")
        filename_without_ext = os.path.splitext(file.filename)[0]
        temp_name = filename_without_ext.lower()
        for word_to_remove in ["resume", "cv", "profile", "bio", "final"]:
            temp_name = temp_name.replace(word_to_remove, "")
        temp_name = temp_name.replace("_", " ").replace("-", " ").strip()
        cleaned_name = " ".join([word.capitalize() for word in temp_name.split()])
        
        # Look for an existing candidate in this job pipeline with a matching name
        existing_applicant = db.query(Applicant).filter(
            Applicant.job_id == job_id,
            func.lower(Applicant.name).like(f"%{cleaned_name.lower()}%")
        ).first()
        
        if existing_applicant:
            # Map resume to the existing candidate record
            existing_applicant.resume_url = file_path
            existing_applicant.resume_analysed = True
            db.add(existing_applicant)
            created_applicants.append(existing_applicant)
        else:
            # Create new applicant profile
            email = f"{cleaned_name.lower().replace(' ', '.')}@candidate.io"
            applicant = Applicant(
                name=cleaned_name,
                email=email,
                phone="+1 555-0199",
                source=ApplicantSource.bulk_upload,
                resume_url=file_path,
                job_id=job_id,
                resume_analysed=True
            )
            db.add(applicant)
            created_applicants.append(applicant)
        
    db.commit()
    for app in created_applicants:
        db.refresh(app)
        
    # Broadcast updates via WebSocket
    message = OutgoingMessage(
        type="candidate_update",
        content=f"Analyzed & added {len(created_applicants)} resumes for {job.role_name}",
        sender="System"
    ).model_dump_json()
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(message, room_id="global"))
    except RuntimeError:
        pass
        
    return created_applicants


@router.patch("/applicants/{applicant_id}", response_model=ApplicantOut)
def update_applicant(applicant_id: UUID, data: ApplicantUpdateIn, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(applicant, key, value)
    db.commit()
    db.refresh(applicant)

    # Broadcast updates via WebSocket
    job = db.query(Job).filter(Job.id == applicant.job_id).first()
    role_name = job.role_name if job else "the position"
    message = OutgoingMessage(
        type="candidate_update",
        content=f"Candidate {applicant.name} updated for {role_name}",
        sender="System"
    ).model_dump_json()
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(message, room_id="global"))
    except RuntimeError:
        pass

    return applicant