import sys
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserStatus, UserType
from app.models.job import Job, JobStatus
from app.models.applicant import Applicant, InterviewStatus, CheatProbability, ApplicantSource
from app.models.organisation import Organisation
from datetime import datetime

def seed():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if user already exists
        admin = db.query(User).filter(User.email == "devasri@zeko.ai").first()
        if not admin:
            print("Seeding default Org. Admin...")
            admin = User(
                name="Devasri",
                email="devasri@zeko.ai",
                designation="Org. Admin",
                user_type=UserType.org_admin,
                status=UserStatus.active
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            print("Org. Admin already exists.")

        # Check jobs
        jobs_count = db.query(Job).count()
        if jobs_count == 0:
            print("Seeding default jobs...")
            job1 = Job(
                custom_job_id="AKRO62EF45E26EA1",
                role_name="Government Tender & Proposal Executive",
                title="Government Tender & Proposal Executive..",
                status=JobStatus.published,
                experience_band="Upto 2 Years",
                is_job_listed=True,
                created_by_id=admin.id
            )
            job2 = Job(
                custom_job_id="AKRO62EF45E26DF5",
                role_name="Full Stack Developer",
                title="Full Stack Developer Hiring - Demo",
                status=JobStatus.published,
                experience_band="1-4 Years",
                is_job_listed=True,
                created_by_id=admin.id
            )
            db.add(job1)
            db.add(job2)
            db.commit()
            db.refresh(job1)
            db.refresh(job2)

            print("Seeding default applicants...")
            app1 = Applicant(
                name="Aditya Rana",
                email="aditya@interviehire.com",
                source=ApplicantSource.direct_link,
                job_id=job2.id,
                resume_analysed=True,
                screening_status=None,
                functional_status=InterviewStatus.completed,
                functional_score=94.0,
                cheat_probability=CheatProbability.low,
                report_url="#"
            )
            app2 = Applicant(
                name="Devasri Bali",
                email="devasri@company.com",
                source=ApplicantSource.direct_link,
                job_id=job1.id,
                resume_analysed=True,
                screening_status=None,
                functional_status=InterviewStatus.completed,
                functional_score=96.0,
                cheat_probability=CheatProbability.low,
                report_url="#"
            )
            app3 = Applicant(
                name="Ines Caetano",
                email="ines@design.io",
                source=ApplicantSource.scheduled,
                job_id=job1.id,
                resume_analysed=True,
                screening_status=InterviewStatus.scheduled,
                screening_score=87.0,
                functional_status=None
            )
            app4 = Applicant(
                name="Sarah Jenkins",
                email="sarah.j@techcorp.com",
                source=ApplicantSource.scheduled,
                job_id=job1.id,
                resume_analysed=True,
                screening_status=InterviewStatus.scheduled,
                screening_score=91.0,
                functional_status=None
            )
            db.add_all([app1, app2, app3, app4])
            db.commit()
        else:
            print("Jobs and applicants already exist.")

        # Check organisation settings
        org_count = db.query(Organisation).count()
        if org_count == 0:
            print("Seeding default organisation settings...")
            org = Organisation(
                org_name="devasri-tech",
                domain="devasri-tech",
                contact_email="devasri@zeko.ai",
                website_link="https://zeko.ai",
                location="Remote",
                description="Build the future of technology with us."
            )
            db.add(org)
            db.commit()
        else:
            print("Organisation settings already exist.")
            
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
