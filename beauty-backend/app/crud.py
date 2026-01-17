# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date, datetime, timedelta #○日後を計算する
from sqlalchemy import func, or_
from .security import get_password_hash

#顧客情報作成
def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

#対象の顧客を取得
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

#顧客詳細を編集▶︎保存で更新
def update_customer(db: Session, customer_id: int, customer_in: schemas.CustomerUpdate):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        return None

    data = customer_in.dict(exclude_unset=True)

    for k, v in data.items():
        setattr(customer, k, v)

    db.commit()
    db.refresh(customer)
    return customer

# 顧客を削除（紐づく来店・明細も削除される）
def delete_customer(db: Session, customer_id: int) -> bool:
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        return False
    db.delete(customer)
    db.commit()
    return True


#スタッフアカウント作成
def create_staff(db: Session, staff_in: schemas.StaffCreate):
    hashed = get_password_hash(staff_in.password)


    staff = models.Staff(
        staff_code=staff_in.staff_code,
        name=staff_in.name,
        email=staff_in.email,
        hashed_password=hashed,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


#対象のスタッフ情報取得
def get_staffs(db: Session):
    return db.query(models.Staff).order_by(models.Staff.id).all()

def get_staff_by_id(db: Session, staff_id: int):
    return db.query(models.Staff).filter(models.Staff.id == staff_id).first()

def get_staff_by_code(db: Session, staff_code: str):
    return db.query(models.Staff).filter(models.Staff.staff_code == staff_code).first()

def get_staff_by_email(db, email: str):
    return db.query(models.Staff).filter(models.Staff.email == email).first()

def count_staffs(db: Session) -> int:
    return db.query(func.count(models.Staff.id)).scalar() or 0

# イベントフォロー対象：直近1年以内に来店がある人
def get_event_targets(db: Session, within_days: int = 365):
    since = date.today() - timedelta(days=within_days)

    latest_visit_sq = (
        db.query(
            models.Visit.customer_id.label("customer_id"),
            func.max(models.Visit.visit_date).label("latest_visit_date"),
        )
        .group_by(models.Visit.customer_id)
        .subquery()
    )

    rows = (
        db.query(models.Customer, latest_visit_sq.c.latest_visit_date)
        .join(latest_visit_sq, latest_visit_sq.c.customer_id == models.Customer.id)
        .filter(latest_visit_sq.c.latest_visit_date >= since)
        .filter(models.Customer.email.isnot(None))
        .filter(models.Customer.email_opt_in.is_(True))
        .order_by(models.Customer.id.desc())
        
        .all()
    )
    return rows



#誕生日フォロー対象：直近1年以内に来店がある人で、今月誕生日の人
def get_birthday_targets_this_month_recent(db: Session, within_days: int = 365):
    since = date.today() - timedelta(days=within_days)
    this_month = date.today().month

    latest_visit_sq = (
        db.query(
            models.Visit.customer_id.label("customer_id"),
            func.max(models.Visit.visit_date).label("latest_visit_date"),
        )
        .group_by(models.Visit.customer_id)
        .subquery()
    )

    rows = (
        db.query(models.Customer, latest_visit_sq.c.latest_visit_date)
        .join(latest_visit_sq, latest_visit_sq.c.customer_id == models.Customer.id)
        .filter(latest_visit_sq.c.latest_visit_date >= since)
        .filter(models.Customer.email.isnot(None))
        .filter(models.Customer.email_opt_in == True)
        .filter(models.Customer.birthday.isnot(None))
        .filter(func.extract("month", models.Customer.birthday) == this_month)
        .order_by(models.Customer.id.desc())
        .all()
    )
    return rows

# 顧客×カテゴリ：最後にそのカテゴリを買った来店日から一定日数以上空いてる人
FOLLOW_THRESHOLD = {"skincare": 90, "makeup": 120}

def get_inactive_customers_by_segment(db: Session, segment: str):
    today = date.today()
    days = FOLLOW_THRESHOLD.get(segment)
    if not days:
        return []

    cutoff = today - timedelta(days=days)

    rows = (
        db.query(
            models.Customer.id.label("customer_id"),
            models.Customer.name.label("name"),
            models.Customer.email.label("email"),
            func.max(models.Visit.visit_date).label("last_visit_date"),
        )
        .join(models.Visit, models.Visit.customer_id == models.Customer.id)
        .join(models.VisitItem, models.VisitItem.visit_id == models.Visit.id)
        .filter(
            models.Customer.email.isnot(None),
            models.Customer.email_opt_in.is_(True),
            models.VisitItem.category == segment,
        )
        .group_by(models.Customer.id, models.Customer.name, models.Customer.email)
        .having(func.max(models.Visit.visit_date) <= cutoff)
        .order_by(func.max(models.Visit.visit_date).asc())
        .all()
    )

    return [
        {
            "customer_id": r.customer_id,
            "name": r.name,
            "email": r.email,
            "last_visit_date": r.last_visit_date,
            "days_since": (today - r.last_visit_date).days,
            "segment": segment,
        }
        for r in rows
        if r.last_visit_date is not None
    ]


# 各対象メール（birthday / event 専用）
def get_mail_targets(
    db: Session,
    mail_type: schemas.MailType,
    within_days: int = 365,
):
    if mail_type == schemas.MailType.event:
        # 直近within_days以内に来店がある（emailあり & 同意あり）
        return get_event_targets(db, within_days=within_days)

    if mail_type == schemas.MailType.birthday:
        # 今月誕生日 & 直近within_days以内に来店がある
        return get_birthday_targets_this_month_recent(db, within_days=within_days)

    # purchase_follow はここでは扱わない（別APIへ誘導する方針）
    return []


#条件に合う顧客を、DBから探して取ってくる　（limit: int = 50＝最大50人）
def get_customers(db: Session, q: str | None = None, limit: int = 50): 
    query = db.query(models.Customer) #顧客テーブルを参照

    if q: #検索ワードがある時のみ実行
        like = f"%{q}%" 
        query = query.filter(
            or_( #OR検索↓どれか1つでも当てはまればOK　（ilike = 大文字・小文字を区別しない）
                models.Customer.name.ilike(like),
                models.Customer.kana.ilike(like),
                models.Customer.phone.ilike(like),
                models.Customer.email.ilike(like),
            )
        )

    return query.order_by(models.Customer.id.desc()).limit(limit).all() #新しく登録した順に並び替えて返す※最大50人

FOLLOW_DAYS = {"skincare": 90,"makeup": 120}

#購入品（VisitItem）に対して、フォロー送信済みの日時を記録する
def mark_purchase_follow_sent(db: Session, visit_item_id: int):
    item = ( #対象の購入品を探す
        db.query(models.VisitItem)
        .filter(models.VisitItem.id == visit_item_id)
        .first()
    )
    if not item:
        return None

    # 未送信なら送信日時を入れる。すでに送信済みならそのまま返す
    if item.follow_sent_at is None:
        item.follow_sent_at = datetime.utcnow()
        db.commit()
        db.refresh(item)

    return item


# 1回の来店分を作成
def create_visit(db: Session, visit_in: schemas.VisitCreate) -> models.Visit:
    visit = models.Visit(
        customer_id=visit_in.customer_id,
        visit_date=visit_in.visit_date,
        memo=visit_in.memo,
        staff_id=visit_in.staff_id,
    )
    db.add(visit)
    db.flush()  # visit.id をここで確定させる（itemsにFKで使う）

    # VisitItem（明細）作成
    for item_in in visit_in.items:
        cat = item_in.category
        days = FOLLOW_DAYS.get(cat, 0)  # ← 未知カテゴリは0日（フォローなし扱い）
        due = visit_in.visit_date + timedelta(days=days)

        db_item = models.VisitItem(
            visit_id=visit.id,
            category=cat,
            product_name=item_in.product_name,
            note=item_in.note,
            follow_due_date=due,
        )
        db.add(db_item)

    db.commit()
    db.refresh(visit)
    return visit




#来店情報を更新
def update_visit(db: Session, visit_id: int, visit_in: schemas.VisitUpdate) -> models.Visit | None:
    visit = db.query(models.Visit).filter(models.Visit.id == visit_id).first()
    if not visit:
        return None

    # 1) Visit（ヘッダ）更新
    visit.visit_date = visit_in.visit_date
    visit.memo = visit_in.memo
    visit.staff_id = visit_in.staff_id

    # 2) VisitItem（明細）を全部入れ替え
    db.query(models.VisitItem).filter(models.VisitItem.visit_id == visit_id).delete()
    db.flush()
    
    for item_in in visit_in.items:
        cat = item_in.category
        days = FOLLOW_DAYS.get(cat, 0)  # ← 未知カテゴリは0日（フォローなし扱い）
        due = visit_in.visit_date + timedelta(days=days)

        db_item = models.VisitItem(
            visit_id=visit.id,
            category=cat,
            product_name=item_in.product_name,
            note=item_in.note,
            follow_due_date=due,
        )
        db.add(db_item)

    #Customer.last_visit_date を再計算
    customer = db.query(models.Customer).filter(models.Customer.id == visit.customer_id).first()
    if customer:
        latest = (
            db.query(func.max(models.Visit.visit_date))
            .filter(models.Visit.customer_id == customer.id)
            .scalar()
        )
        customer.last_visit_date = latest

    db.commit()
    db.refresh(visit)
    return visit


#来店記録を新しい順に取ってくる
def get_visits_by_customer(db: Session, customer_id: int):
    return (
        db.query(models.Visit)
        .filter(models.Visit.customer_id == customer_id)
        .order_by(models.Visit.visit_date.desc(), models.Visit.id.desc())#新しく来店した順に取ってくる
        .all()
    )

# 来店記録を削除する（Visitと紐づく明細も削除）
def delete_visit(db: Session, visit_id: int) -> bool:
    visit = db.query(models.Visit).filter(models.Visit.id == visit_id).first()
    if not visit:
        return False

    # 明細（VisitItem）を先に消す（cascade設定が無くても消える）
    db.query(models.VisitItem).filter(models.VisitItem.visit_id == visit_id).delete()

    # ヘッダ（Visit）を消す
    db.delete(visit)

    db.commit()
    return True

# 本日の来店数を取得
def get_today_visit_count(db: Session) -> int:
    today = date.today()

    return (
        db.query(func.count(models.Visit.id))
        .filter(models.Visit.visit_date == today)
        .scalar()
        or 0
    )

#今月の新規顧客数
def get_monthly_new_customer_count(db: Session) -> int:
    today = date.today()
    first_day = date(today.year, today.month, 1)

    return (
        db.query(func.count(models.Customer.id))
        .filter(models.Customer.created_at >= first_day)
        .scalar()
        or 0
    )