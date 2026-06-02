from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.organisation import Organisation
from app.schemas import OrganisationOut, OrganisationIn
import shutil, os

router = APIRouter()

UPLOAD_DIR = "uploads/logos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=OrganisationOut)
def get_organisation(db: Session = Depends(get_db)):
    org = db.query(Organisation).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation settings not set up yet")
    return org


@router.put("", response_model=OrganisationOut)
def upsert_organisation(data: OrganisationIn, db: Session = Depends(get_db)):
    org = db.query(Organisation).first()
    if org:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(org, key, value)
    else:
        org = Organisation(**data.model_dump())
        db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.post("/logo")
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    org = db.query(Organisation).first()
    if org:
        org.logo_url = file_path
        db.commit()

    return {"logo_url": file_path}
