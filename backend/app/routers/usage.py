from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.job import Job
from app.models.applicant import Applicant, ApplicantSource
from app.schemas import UsageStatsOut, JobTableRow

router = APIRouter()


@router.get("/stats", response_model=UsageStatsOut)
def get_usage_stats(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Applicant)
    if date_from:
        query = query.filter(Applicant.created_at >= date_from)
    if date_to:
        query = query.filter(Applicant.created_at <= date_to)

    applicants = query.all()

    return UsageStatsOut(
        total_applicants=len(applicants),
        career_page=sum(1 for a in applicants if a.source == ApplicantSource.career_page),
        bulk_upload=sum(1 for a in applicants if a.source == ApplicantSource.bulk_upload),
        scheduled=sum(1 for a in applicants if a.source == ApplicantSource.scheduled),
        direct_link=sum(1 for a in applicants if a.source == ApplicantSource.direct_link),
        resume_analysed=sum(1 for a in applicants if a.resume_analysed),
        resume_shortlisted=sum(1 for a in applicants if a.resume_shortlisted),
        resume_waitlisted=sum(1 for a in applicants if a.resume_waitlisted),
        screening_attempted=sum(1 for a in applicants if a.screening_status is not None),
        screening_scheduled=sum(1 for a in applicants if a.screening_status and a.screening_status.value == "scheduled"),
        screening_shortlisted=sum(1 for a in applicants if a.screening_score and a.screening_score >= 60),
        screening_waitlisted=0,  # define your own threshold
        functional_attempted=sum(1 for a in applicants if a.functional_status is not None),
        functional_scheduled=sum(1 for a in applicants if a.functional_status and a.functional_status.value == "scheduled"),
        functional_shortlisted=sum(1 for a in applicants if a.functional_score and a.functional_score >= 60),
        functional_waitlisted=0,
    )


@router.get("/jobs-table")
def get_jobs_table(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return [
        {
            "id": str(j.id),
            "custom_job_id": j.custom_job_id,
            "role_name": j.role_name,
            "title": j.title,
            "experience_band": j.experience_band,
            "tags": j.tags,
            "created_by_name": j.created_by.name if j.created_by else None,
        }
        for j in jobs
    ]


@router.get("/candidates-table")
def get_candidates_table(db: Session = Depends(get_db)):
    applicants = db.query(Applicant).all()
    return [
        {
            "id": str(a.id),
            "name": a.name,
            "email": a.email,
            "phone": a.phone,
            "source": a.source,
            "job_id": str(a.job_id),
            "screening_status": a.screening_status,
            "screening_score": a.screening_score,
            "functional_status": a.functional_status,
            "functional_score": a.functional_score,
            "cheat_probability": a.cheat_probability,
            "recruiter_screening": a.recruiter_screening,
            "recruiter_screening_score": a.recruiter_screening_score,
            "resume_score": a.resume_score,
            "attempted_at": a.attempted_at.isoformat() if a.attempted_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "resume_url": a.resume_url,
            "resume_analysed": a.resume_analysed,
        }
        for a in applicants
    ]