# app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi import Request

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
app.include_router(auth_router, prefix="/api")        #ログイン系
app.include_router(customers_router, prefix="/api")   #顧客登録API
app.include_router(staffs.router, prefix="/api")      #スタッフ登録
app.include_router(emails.router, prefix="/api")      #メール送信(ダミー)
app.include_router(visits.router, prefix="/api")      #来店／購入履歴の登録
app.include_router(follow_mail.router, prefix="/api") #フォロー対象の抽出API
app.include_router(dashboard.router, prefix="/api") #ダッシュボード系

@app.get("/status")
def status():
    return {"status": "ok"}

BASE_DIR = Path(__file__).resolve().parent
static_dir = BASE_DIR / "static"
app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")

INDEX_HTML = static_dir / "index.html"

@app.get("/{full_path:path}")
def spa_fallback(full_path: str, request: Request):
    # APIと静的ファイルは触らない
    if full_path.startswith("api/"):
        return {"detail": "Not Found"}  # ここはAPI側の404として返す

    # 実ファイルが存在するなら StaticFiles に任せたいが、
    # ここに来る時点でStaticFilesが拾えてないので index.html を返す
    if INDEX_HTML.exists():
        return FileResponse(str(INDEX_HTML))

    return {"detail": "index.html not found"}