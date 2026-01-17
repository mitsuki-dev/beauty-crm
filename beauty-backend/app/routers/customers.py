# app/routers/customers.py
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas, crud

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
)

@router.post("", response_model=schemas.CustomerRead)
def create_customer_endpoint(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
):
    return crud.create_customer(db, customer)

@router.get("", response_model=List[schemas.CustomerRead])
def list_customers(q: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_customers(db, q=q)

@router.get("/{customer_id}", response_model=schemas.CustomerRead)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{customer_id}", response_model=schemas.CustomerRead)
def update_customer(customer_id: int, customer_in: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    updated = crud.update_customer(db, customer_id, customer_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated