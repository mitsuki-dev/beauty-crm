# app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .auth import router as auth_router
from .routers.customers import router as customers_router
from .database import Base, engine
from . import models  # モデル登録のため
from .routers import staffs, emails, visits, follow_mail, dashboard  # ←相対で統一


app = FastAPI(title="Re:Beauty API")

# ここでテーブルを作成（models 内の Base クラスたちを読み込んだあと）
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.11.48:5173","https://mitsukidev.pythonanywhere.com"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ここで登録！
app.include_router(auth_router)        #ログイン系
app.include_router(customers_router)   #顧客登録API
app.include_router(staffs.router)      #スタッフ登録
app.include_router(emails.router)      #メール送信(ダミー)
app.include_router(visits.router)      #来店／購入履歴の登録
app.include_router(follow_mail.router) #フォロー対象の抽出API
app.include_router(dashboard.router) #ダッシュボード系

@app.get("/status")
def status():
    return {"status": "ok"}

BASE_DIR = Path(__file__).resolve().parent
static_dir = BASE_DIR / "static"
app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")
