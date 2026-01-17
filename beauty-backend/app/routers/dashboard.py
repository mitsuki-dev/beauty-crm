# app/routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/inactive-customers", response_model=List[schemas.InactiveCustomerTarget])
def inactive_customers(segment: str = "skincare", db: Session = Depends(get_db)):
    return crud.get_inactive_customers_by_segment(db, segment=segment)

@router.get("/monthly-new-count")
def monthly_new_count(db: Session = Depends(get_db)):
    return {"count": crud.get_monthly_new_customer_count(db)}
