# app/routers/visits.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/visits", tags=["visits"])

#フロントから新しく来店記録を登録（POST）
@router.post("/", response_model=schemas.VisitRead)
def create_visit(payload: schemas.VisitCreate, db: Session = Depends(get_db)): #フロントから送られてきた内容をschema指定の形でdbが登録
    try:
        return crud.create_visit(db, payload) #crud.create_visiに登録依頼
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) #登録できなかった場合400 Bad Requestを返す

#来店履歴を取得(GET)
@router.get("/by-customer/{customer_id}", response_model=List[schemas.VisitRead]) #List=複数ある来店履歴
def list_visits_by_customer(customer_id: int, db: Session = Depends(get_db)): #顧客IDで来店履歴を取ってくる
    return crud.get_visits_by_customer(db, customer_id) #crud.get_visitsに取得依頼

#来店記録を削除
@router.delete("/{visit_id}") #削除したい来店記録をIDで指定して取ってくる
def delete_visit_endpoint(visit_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_visit(db, visit_id) #crud.delete_visiに削除依頼
    if not ok: #削除完了
        raise HTTPException(status_code=404, detail="Visit not found") #削除できなかった場合404 Not Foundを返す
    return {"ok": True}

#来店記録を編集して更新
@router.put("/{visit_id}", response_model=schemas.VisitRead) #来店記録のIDを指定して取ってくる
def update_visit_endpoint(
    visit_id: int, #URLからどの来店を編集するか
    payload: schemas.VisitUpdate, #修正したい内容
    db: Session = Depends(get_db), #データベース操作
):
    try:
        updated = crud.update_visit(db, visit_id, payload) #更新依頼
        if not updated:
            raise HTTPException(status_code=404, detail="Visit not found") #更新できなかった場合404 Not Foundで返す
        return updated #正常に更新できたら更新内容を返す
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) #フロントから送ってきた内容が不正の場合400 Bad Requestで返す

#本日の来店数を取得
@router.get("/today-count")
def get_today_count(db: Session = Depends(get_db)):
    return {
        "count": crud.get_today_visit_count(db)
    }