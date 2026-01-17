# app/models.py
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    DateTime,
    Date,
    func,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    kana = Column(String, index=True, nullable=True)
    phone = Column(String, index=True, nullable=True, unique=False)
    email = Column(String, index=True, nullable=True, unique=False)
    note = Column(String, nullable=True)

    birthday = Column(Date, nullable=True)  # 誕生日（誕生日メール用）
    email_opt_in = Column(Boolean, nullable=False, server_default="1")  # メール配信OK?
    last_visit_date = Column(Date, nullable=True)  # 最終来店日
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    visits = relationship("Visit",back_populates="customer",cascade="all, delete-orphan",)


class Staff(Base):
    __tablename__ = "staffs"

    id = Column(Integer, primary_key=True, index=True)
    staff_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    hashed_password = Column(String, nullable=False)


class Visit(Base):
    """
    来店（ヘッダ）
    """

    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)

    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)# どのお客様の履歴か

    visit_date = Column(Date, nullable=False)# 来店日・購入日

    memo = Column(String, nullable=True)# メモ（任意）

    staff_id = Column(Integer, ForeignKey("staffs.id"), nullable=True, index=True)# 対応スタッフ（任意）

    created_at = Column(DateTime, server_default=func.now())  # 1個だけにする

    # Customer とのリレーション
    customer = relationship("Customer", back_populates="visits")

    # Visit 1回に対して VisitItem が複数
    items = relationship("VisitItem",back_populates="visit",cascade="all, delete-orphan",)

    # スタッフ参照
    staff = relationship("Staff")


class VisitItem(Base):
    """
    来店の明細（購入カテゴリ単位）
    例：同じ来店で skincare と makeup を買ったら2行できる
    """

    __tablename__ = "visit_items"

    id = Column(Integer, primary_key=True, index=True)

    
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)# 親Visitに紐付け

   
    category = Column(String, nullable=False, index=True) # "skincare" or "makeup"

    
    product_name = Column(String, nullable=True)# 将来拡張用
    note = Column(String, nullable=True)

    
    follow_due_date = Column(Date, nullable=False, index=True)# フォロー期限（skincare: 90日後 / makeup: 120日後）

   
    follow_sent_at = Column(DateTime, nullable=True) # 重複防止（送ったら日時を入れる）

    created_at = Column(DateTime, server_default=func.now())

    
    visit = relationship("Visit", back_populates="items")# 親Visitへ戻る

