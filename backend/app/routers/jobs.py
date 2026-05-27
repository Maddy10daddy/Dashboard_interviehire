from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import shutil, os

from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.applicant import Applicant, ApplicantSource
from app.models.career import JobCollaborator
from app.models.user import User, UserType
from app.schemas import (
    JobListOut, JobOut, JobDetailOut, JobSettingsIn,
    JobPipelineCounts, CollaboratorIn, AddApplicantIn, ApplicantOut, FunnelOut, FunnelStage,
    JobCreateIn, ApplicantUpdateIn
)

router = APIRouter()

UPLOAD_DIR = "uploads/jd"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _build_job_out(job: Job, db: Session) -> dict:
    """Helper to build JobOut with pipeline counts."""
    applicants = db.query(Applicant).filter(Applicant.job_id == job.id).all()
    return {
        **job.__dict__,
        "created_by_name": job.created_by.name if job.created_by else None,
        "pipeline": JobPipelineCounts(
            total=len(applicants),
            resume=sum(1 for a in applicants if a.resume_analysed),  # count analysed resumes
            screening=sum(1 for a in applicants if a.screening_status is not None),
            functional=sum(1 for a in applicants if a.functional_status is not None),
        )
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


@router.post("", response_model=JobDetailOut)
def create_job(data: JobCreateIn, db: Session = Depends(get_db)):
    # Default admin user as creator if one exists
    admin = db.query(User).filter(User.user_type == UserType.org_admin).first()
    new_job = Job(
        title=data.title,
        role_name=data.role_name,
        experience_band=data.experience_band,
        custom_job_id=data.custom_job_id,
        status=data.status,
        created_by_id=admin.id if admin else None,
        resume_analysis_enabled=data.resume_analysis_enabled,
        recruiter_screening_enabled=data.recruiter_screening_enabled,
        functional_interview_enabled=data.functional_interview_enabled
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


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


# ─── JOB DETAIL ──────────────────────────────────────────────────────────────

@router.get("/{job_id}", response_model=JobDetailOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}/settings", response_model=JobDetailOut)
def update_job_settings(job_id: UUID, data: JobSettingsIn, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job


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
    return applicant


@router.patch("/applicants/{applicant_id}", response_model=ApplicantOut)
def update_applicant(applicant_id: UUID, data: ApplicantUpdateIn, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(applicant, key, value)
    db.commit()
    db.refresh(applicant)
    return applicant