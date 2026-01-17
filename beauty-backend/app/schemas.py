# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from datetime import date, datetime
from typing import Optional,List

#//////////////////////
#購入品の共通部分
class VisitItemBase(BaseModel):
    category: str  # "skincare" or "makeup"　or "other"
    product_name: Optional[str] = None
    note: Optional[str] = None

#新しく登録するとき
class VisitItemCreate(VisitItemBase):
    pass

#購入品をDBから取得して返すとき
class VisitItemRead(VisitItemBase):
    id: int
    follow_due_date: date
    follow_sent_at: Optional[datetime] = None
#SQLAlchemyモデル → schema へ変換できるようにする
    class Config:
        from_attributes = True


#//////////////////////
#来店記録の基本情報の共通部分
class VisitBase(BaseModel):
    customer_id: int
    visit_date: date
    memo: Optional[str] = None
    staff_id: Optional[int] = None

#来店を新しく登録するとき
class VisitCreate(VisitBase):
    items: List[VisitItemCreate] #その来店での購入品・施術（items）も一緒に送る

#来店内容を更新するとき※全差し替え（customer_id は変更しない前提）
class VisitUpdate(BaseModel):
    visit_date: date
    memo: Optional[str] = None
    staff_id: Optional[int] = None
    items: List[VisitItemCreate]

#来店詳細を画面に返す
class VisitRead(VisitBase):
    id: int
    created_at: Optional[datetime] = None
    items: List[VisitItemRead] = Field(default_factory=list)
    class Config:
        from_attributes = True

#顧客＋カテゴリの最終来店
class InactiveCustomerTarget(BaseModel):
    customer_id: int
    name: str
    email: EmailStr
    last_visit_date: date
    days_since: int
    segment: str


#//////////////////////
# 顧客の基本情報（共通）
class CustomerBase(BaseModel):
    name: str
    kana: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    email_opt_in: bool = True
    note: Optional[str] = None
    birthday: Optional[date] = None


# 顧客新しく作成したとき
class CustomerCreate(CustomerBase):
    pass


#顧客詳細を画面に返す（DBのidを含む）
class CustomerRead(CustomerBase):
    id: int

    class Config:
        from_attributes = True

#顧客詳細を編集▶︎保存で更新
class CustomerUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birthday: Optional[date] = None
    note: Optional[str] = None
    email_opt_in: Optional[bool] = None


#//////////////////////
# スタッフ登録
class StaffBase(BaseModel):
    staff_code: str
    name: Optional[str] = None
    email: EmailStr

# スタッフ新しく作成した時
class StaffCreate(BaseModel):
    staff_code: Optional[str] = None
    name: Optional[str] = None
    email: EmailStr
    password: str

#スタッフ詳細を画面に返す
class StaffRead(BaseModel):
    id: int
    staff_code: Optional[str] = None
    name: Optional[str] = None
    email: EmailStr
    class Config:
        from_attributes = True



#//////////////////////
# メール送信機能
#テスト送信
class EmailTestRequest(BaseModel):
    subject: str
    body: str

#複数人への一斉送信
class EmailBulkRequest(BaseModel):
    subject: str
    body: str
    customer_ids: List[int]

#フロントへ返す送信結果
class EmailSendResponse(BaseModel):
    message: str
    sent_count: int

#メールの種類(誕生日、イベント、フォロー対象)
class MailType(str, Enum):
    birthday = "birthday"
    event = "event"
    purchase_follow = "purchase_follow"

#送信対象(誕生日、イベント)
class MailTarget(BaseModel):
    id: int
    name: str
    email: EmailStr
    birthday: Optional[date] = None           # ★追加
    latest_visit_date: Optional[date] = None  # ★追加（直近来店フィルタ確認用に便利）

    class Config:
        from_attributes = True
