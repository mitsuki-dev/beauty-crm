from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import os

from .. import schemas, crud
from ..database import get_db
from ..auth import get_current_user, get_optional_user

router = APIRouter(
    prefix="/staffs",
    tags=["staffs"],
)


@router.get("/", response_model=list[schemas.StaffRead])
def list_staffs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 一覧はログイン必須
):
    return crud.get_staffs(db)


@router.post("/", response_model=schemas.StaffRead)
def create_staff(
    staff: schemas.StaffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),  #（トークン無しなら None）
    x_bootstrap_code: str | None = Header(default=None, alias="X-Bootstrap-Code"),
):
    staff_count = crud.count_staffs(db)

    # .env の値を読む
    secret = os.getenv("STAFF_BOOTSTRAP_CODE")

    # 0人なら「シークレット必須」で作成OK（トークン不要）
    if staff_count == 0:
        if not secret:
            raise HTTPException(
                status_code=500,
                detail="STAFF_BOOTSTRAP_CODE が設定されていません（.env を確認）",
            )
        if x_bootstrap_code != secret:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bootstrap code が違います（X-Bootstrap-Code）",
            )
        return crud.create_staff(db, staff)

    # 1人以上ならログイン必須
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return crud.create_staff(db, staff)
