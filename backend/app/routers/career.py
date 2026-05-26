from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.career import CareerPage
from app.schemas import CareerPageOut, CareerPageIn
import shutil, os

router = APIRouter()

UPLOAD_DIR = "uploads/logos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=CareerPageOut)
def get_career_page(db: Session = Depends(get_db)):
    page = db.query(CareerPage).first()
    if not page:
        raise HTTPException(status_code=404, detail="Career page not set up yet")
    return page


@router.put("", response_model=CareerPageOut)
def upsert_career_page(data: CareerPageIn, db: Session = Depends(get_db)):
    page = db.query(CareerPage).first()
    if page:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(page, key, value)
    else:
        page = CareerPage(**data.model_dump())
        db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.post("/logo")
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    page = db.query(CareerPage).first()
    if page:
        page.logo_url = file_path
        db.commit()

    return {"logo_url": file_path}