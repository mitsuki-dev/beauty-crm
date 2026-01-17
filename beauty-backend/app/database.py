# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite を使う（beauty_crm.db ファイルが作られる）
SQLALCHEMY_DATABASE_URL = "sqlite:///./beauty_crm.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite のおまじない
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# FastAPI から使う DB セッションを提供する依存性
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
