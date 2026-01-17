import React, { useEffect, useState } from "react";

import { API_BASE_URL } from "../api/config";
/**
 * スタッフのアカウントを登録＆一覧表示するカード
 */
function StaffAccountCard() {
  const [form, setForm] = useState({
    staffCode: "",
    name: "",
    email: "",
    password: "",
  });
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 共通ヘッダー（アクセストークンがあれば Authorization を付ける）
  const buildHeaders = () => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("rb_token");

    const headers = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // スタッフ一覧取得
  const fetchStaffs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/staffs/`, {
        method: "GET",
        headers: buildHeaders(),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.warn("スタッフ一覧の取得に失敗しました", res.status, txt);
        return;
      }

      const data = await res.json();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("スタッフ一覧取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchStaffs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 登録ボタン押下
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.staffCode.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage("スタッフID・メールアドレス・パスワードは必須です");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/staffs/`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          staff_code: form.staffCode,
          name: form.name,
          email: form.email,
          password: form.password, // 追加
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setMessage(`登録に失敗しました (${res.status})`);
        console.error("スタッフ登録失敗:", res.status, txt);
        return;
      }

      setMessage("スタッフを登録しました");
      setForm({ staffCode: "", name: "", email: "", password: "" });
      fetchStaffs(); // 一覧を更新
    } catch (err) {
      console.error("スタッフ登録エラー:", err);
      setMessage("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">
        スタッフアカウント登録
      </h2>

      <p className="mt-1 text-xs text-gray-500">
        サロンで利用するスタッフのIDとメールアドレスを管理します。
      </p>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">スタッフID</label>
          <input
            type="text"
            name="staffCode"
            value={form.staffCode}
            onChange={handleChange}
            placeholder="例）S-0001"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            スタッフ名（任意）
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="例）山田 花子"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@salon.co.jp"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* ✅追加：パスワード */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">パスワード</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="ログイン用パスワード"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            ※ 登録したメール＋このパスワードでログインできます
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
          {message && (
            <p className="text-xs text-gray-600" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </form>

      {/* 登録済みスタッフ一覧 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          登録済みスタッフ
        </h3>

        {staffs.length === 0 ? (
          <p className="text-xs text-gray-500">
            まだスタッフが登録されていません。
          </p>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-auto text-xs">
            {staffs.map((s) => (
              <li
                key={s.id ?? s.staff_code}
                className="flex justify-between gap-2 rounded-md border px-2 py-1 bg-gray-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {s.name || "（名前未設定）"}
                    {s.staff_code && (
                      <span className="text-gray-400"> / {s.staff_code}</span>
                    )}
                  </span>
                  <span className="text-gray-500">{s.email}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default StaffAccountCard;
