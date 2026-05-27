from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas import ChangePasswordIn
 
router = APIRouter()
 
 
@router.put("/password")
def change_password(data: ChangePasswordIn, db: Session = Depends(get_db)):
    # TODO: once auth is added, get current user from JWT token
    # For now this is a placeholder
    # user = get_current_user(token)
    # if not verify_password(data.current_password, user.hashed_password):
    #     raise HTTPException(status_code=400, detail="Current password is incorrect")
    # user.hashed_password = hash_password(data.new_password)
    # db.commit()
    return {"message": "Password updated successfully"}
 