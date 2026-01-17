// src/components/HomeScreen.jsx
import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function LargeNavCard({ label, onClick, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
    >
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold tracking-wide text-gray-800">
          {label}
        </p>
        <span className="text-sm text-gray-400 transition-transform group-hover:translate-x-0.5">
          ▶
        </span>
      </div>
      {description ? (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      ) : null}
    </button>
  );
}

function AnimatedTitle({ text }) {
  return (
    <h1 className="flex gap-1 text-4xl font-extrabold tracking-tight text-gray-900">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
        >
          {char}
        </motion.span>
      ))}
    </h1>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-left hover:opacity-80"
          >
            <AnimatedTitle text="Re:Beauty" />
          </button>

          <p className="mt-2 text-lg text-gray-500">ホーム</p>
        </header>

        {/* ナビゲーションカード（縦並び） */}
        <div className="flex flex-col gap-4">
          <LargeNavCard
            label="顧客登録"
            description="新しい顧客を追加します"
            onClick={() => navigate("/customers/new")}
          />
          <LargeNavCard
            label="顧客検索"
            description="名前・電話・メモから検索"
            onClick={() => navigate("/customers/search")}
          />
          <LargeNavCard
            label="ダッシュボード"
            description="KPI / フォロー進捗 / カテゴリ別売上など"
            onClick={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </main>
  );
}
