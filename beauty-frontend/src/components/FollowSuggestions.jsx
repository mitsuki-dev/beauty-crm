// src/components/FollowSuggestions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../api/config";

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-semibold text-gray-800 tracking-tight">
      {children}
    </h2>
  );
}

function SeeMoreButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-pink-50 active:translate-y-[1px]"
    >
      もっとみる
    </button>
  );
}

function SegmentTabs({ segment, setSegment }) {
  const btn = (key, label) => (
    <button
      type="button"
      onClick={() => setSegment(key)}
      className={`rounded-xl px-3 py-1.5 text-xs font-medium border ${
        segment === key
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      {btn("skincare", "スキンケア")}
      {btn("makeup", "メイク")}
    </div>
  );
}

export default function FollowSuggestions({ limit = 5, showSeeMore = true }) {
  const navigate = useNavigate();

  const [segment, setSegment] = useState("skincare");
  const [targets, setTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 来店がしばらくないお客様（顧客×カテゴリの最終来店から90/120日以上）を取得
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTargets() {
      setIsLoading(true);
      setError("");

      try {
        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("rb_token");

        const params = new URLSearchParams({ segment });

        const res = await fetch(
          `${API_BASE_URL}/dashboard/inactive-customers?${params.toString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`取得に失敗しました (${res.status}) ${txt}`);
        }

        const data = await res.json();
        setTargets(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError("フォロー対象の取得に失敗しました");
          setTargets([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTargets();
    return () => controller.abort();
  }, [segment]);

  // 表示優先度：来店が空いてる順（days_since が大きいほど上）
  const sorted = useMemo(() => {
    return [...targets].sort(
      (a, b) => (b.days_since ?? 0) - (a.days_since ?? 0)
    );
  }, [targets]);

  const thresholdLabel = segment === "skincare" ? "90日" : "120日";

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionTitle>フォローが必要なお客様（来店なし）</SectionTitle>
          <p className="mt-1 text-xs text-gray-500">
            最新の来店記録から{thresholdLabel}
            以上来店がないお客様を表示しています（読み取り専用）。
          </p>
        </div>
        <SegmentTabs segment={segment} setSegment={setSegment} />
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-3">
        {isLoading ? (
          <div className="py-4 text-xs text-gray-500">読み込み中…</div>
        ) : sorted.length === 0 ? (
          <div className="py-4 text-xs text-gray-500">
            該当するお客様はいません 🎉
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.slice(0, limit).map((t) => (
              <li
                key={t.customer_id}
                className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-gray-100"
                onClick={() => navigate(`/customers/${t.customer_id}`)}
                title="クリックで顧客詳細へ"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {t.name}
                      <span className="ml-2 text-[10px] text-gray-400">
                        （ID:{t.customer_id}）
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-gray-700">
                      最終来店：{t.last_visit_date} ／{" "}
                      <span className="font-semibold text-red-600">
                        {t.days_since}日
                      </span>
                      来店なし
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600">
                        {segment}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600">
                        inactive-customers
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-gray-500 truncate">
                      {t.email}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs text-gray-500">詳細 →</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showSeeMore ? (
        <SeeMoreButton onClick={() => navigate("/follow")} />
      ) : null}
    </div>
  );
}
