# app/routers/emails.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/emails",
    tags=["emails"],
)

def user_get(u, key, default=None):
    # current_user が dict の場合も、SQLAlchemyモデルの場合も対応
    if isinstance(u, dict):
        return u.get(key, default)
    return getattr(u, key, default)

def user_label(u):
    return (
        user_get(u, "staff_code")
        or user_get(u, "email")
        or user_get(u, "name")
        or "unknown"
    )

@router.post("/test", response_model=schemas.EmailSendResponse)
def send_test_email(
    payload: schemas.EmailTestRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 実際の開発ならここでメール送信サービス（SendGrid等）を呼ぶ
    print("==== [TEST EMAIL] ====")
    print(f"to user: {user_label(current_user)} (id={user_get(current_user, 'id', 'unknown')})")
    print(f"subject: {payload.subject}")
    print(f"body:\n{payload.body}")
    print("======================")

    return schemas.EmailSendResponse(
        message="テストメール送信処理を実行しました（ダミー）",
        sent_count=1,
    )

@router.post("/bulk", response_model=schemas.EmailSendResponse)
def send_bulk_email(
    payload: schemas.EmailBulkRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    print("==== [BULK EMAIL] ====")
    print(f"requested by: {user_label(current_user)} (id={user_get(current_user, 'id', 'unknown')})")
    print(f"to customer_ids: {payload.customer_ids}")
    print(f"subject: {payload.subject}")
    print(f"body:\n{payload.body}")
    print("======================")

    return schemas.EmailSendResponse(
        message="一斉メール送信処理を実行しました（ダミー）",
        sent_count=len(payload.customer_ids),
    )
