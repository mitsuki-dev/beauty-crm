# app/auth.py
from datetime import datetime, timedelta
from typing import Optional
import os

from fastapi import APIRouter, HTTPException, status, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .database import get_db
from . import crud
from .security import verify_password  # ✅ security.pyの関数だけ使う

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class PublicUser(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr
    role: str = "staff"


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PublicUser


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    staff = crud.get_staff_by_email(db, email=str(payload.email))

    if (not staff) or (not verify_password(payload.password, staff.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが違います",
        )

    token = create_access_token({"sub": str(staff.id), "email": staff.email, "role": "staff"})

    return TokenOut(
        access_token=token,
        user=PublicUser(
            id=staff.id,
            name=getattr(staff, "name", None),
            email=staff.email,
            role="staff",
        ),
    )


@router.get("/ping")
def ping():
    return {"ok": True}


# =======================
# 認証
# =======================
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です。ログインし直してください。",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise credentials_exception
        staff_id = int(sub)
    except (JWTError, ValueError):
        raise credentials_exception

    staff = crud.get_staff_by_id(db, staff_id)
    if staff is None:
        raise credentials_exception

    return {"id": staff.id, "name": getattr(staff, "name", None), "email": staff.email, "role": "staff"}


def get_optional_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Security(optional_security),
) -> dict | None:
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            return None
        staff_id = int(sub)
    except Exception:
        return None

    staff = crud.get_staff_by_id(db, staff_id)
    if not staff:
        return None

    return {"id": staff.id, "name": getattr(staff, "name", None), "email": staff.email, "role": "staff"}
