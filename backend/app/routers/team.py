from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserStatus
from app.schemas import TeamListOut, UserOut, InviteMemberIn

router = APIRouter()


@router.get("", response_model=TeamListOut)
def get_team(db: Session = Depends(get_db)):
    members = db.query(User).all()
    return TeamListOut(
        members=members,
        total=len(members),
        active=sum(1 for m in members if m.status == UserStatus.active),
        invited=sum(1 for m in members if m.status == UserStatus.invited),
        inactive=sum(1 for m in members if m.status == UserStatus.inactive),
    )


@router.post("/invite", response_model=UserOut)
def invite_member(data: InviteMemberIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        name=data.name,
        email=data.email,
        designation=data.designation,
        user_type=data.user_type,
        status=UserStatus.invited,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.delete("/{user_id}")
def remove_member(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "Member removed"}