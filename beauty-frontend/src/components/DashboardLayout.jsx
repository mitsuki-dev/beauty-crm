// src/components/DashboardLayout.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function DashboardLayout({ sidebar, children }) {
  const staffName = localStorage.getItem("rb_staff_name") || "—";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 上のヘッダー */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/Home"
            className="text-xl font-bold tracking-tight hover:opacity-80"
            aria-label="ホームへ戻る"
          >
            Re:Beauty
          </Link>
          <div className="text-sm text-gray-600">ログイン中：{staffName}</div>
        </div>
      </header>

      {/* メイン 2 カラム */}
      <main className="mx-auto flex max-w-6xl gap-4 px-4 py-6">
        {/* 左：サイドバー */}
        {sidebar && (
          <aside className="w-56 shrink-0">
            <div className="space-y-2">{sidebar}</div>
          </aside>
        )}

        {/* 右：メインコンテンツ */}
        <section className="flex-1 space-y-4">{children}</section>
      </main>
    </div>
  );
}
