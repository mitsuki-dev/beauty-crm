from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from datetime import date, timedelta
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/follow-mail",
    tags=["follow-mail"],
)

# =========================
# birthday / event 用（Customer単位）
# =========================
@router.get("/targets", response_model=List[schemas.MailTarget])
def fetch_targets_for_customer_mails(
    mail_type: schemas.MailType,   # birthday / event / purchase_follow
    within_days: int = 365,         # 直近◯日以内（デフォ1年）
    db: Session = Depends(get_db),
):
    # purchase_follow は dashboard のAPIへ誘導
    if mail_type == schemas.MailType.purchase_follow:
        raise HTTPException(
            status_code=400,
            detail="purchase_follow は /dashboard/inactive-customers を使う",
        )

    since = date.today() - timedelta(days=within_days)

    # 顧客ごとの最新来店日
    latest_visit_sq = (
        db.query(
            models.Visit.customer_id.label("customer_id"),
            func.max(models.Visit.visit_date).label("latest_visit_date"),
        )
        .group_by(models.Visit.customer_id)
        .subquery()
    )

    # ベース：直近来店あり + メール同意 + emailあり
    q = (
        db.query(models.Customer, latest_visit_sq.c.latest_visit_date)
        .join(latest_visit_sq, latest_visit_sq.c.customer_id == models.Customer.id)
        .filter(latest_visit_sq.c.latest_visit_date >= since)
        .filter(models.Customer.email.isnot(None))
        .filter(models.Customer.email_opt_in.is_(True))
    )

    if mail_type == schemas.MailType.event:
        rows = q.order_by(models.Customer.id.desc()).all()
        return [
            schemas.MailTarget(
                id=c.id,
                name=c.name,
                email=c.email,
                birthday=c.birthday,
                latest_visit_date=latest,
            )
            for (c, latest) in rows
        ]

    if mail_type == schemas.MailType.birthday:
        this_month = date.today().month
        q2 = (
            q.filter(models.Customer.birthday.isnot(None))
             .filter(func.extract("month", models.Customer.birthday) == this_month)
        )
        rows = q2.order_by(models.Customer.id.desc()).all()
        return [
            schemas.MailTarget(
                id=c.id,
                name=c.name,
                email=c.email,
                birthday=c.birthday,
                latest_visit_date=latest,
            )
            for (c, latest) in rows
        ]

    raise HTTPException(status_code=400, detail="Unsupported mail_type")
