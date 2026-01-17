import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { API_BASE_URL } from "../api/config";

///////// 共通：ゆる一致（全角↔半角、カナ↔ひら、大小無視） ////////
const normalize = (s = "") =>
  s
    .toString()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
    .trim();

//////// ハイライト（簡易） //////////
const highlight = (text, kw) => {
  const t = text ?? "";
  if (!kw) return t;
  const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t
    .toString()
    .split(new RegExp(`(${safe})`, "i"))
    .map((chunk, i) =>
      i % 2 ? <mark key={i}>{chunk}</mark> : <span key={i}>{chunk}</span>
    );
};

//////// 顧客検索（番号 / 名前 / 電話：分割入力） //////////
export default function CustomerSearchSplit() {
  const navigate = useNavigate();

  // 入力状態
  const [qNumber, setQNumber] = useState("");
  const [qName, setQName] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // customers はAPIから入れる
  const [customers, setCustomers] = useState([]);

  // APIから顧客一覧を取得して customers にセット
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("rb_token");

        const res = await fetch(`${API_BASE_URL}/customers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`顧客一覧の取得に失敗しました（${res.status}）`);
        }

        const data = await res.json();

        // いまの画面の検索ロジックが動くように、MOCKと同じ形に変換
        const mapped = (Array.isArray(data) ? data : []).map((c) => {
          const full = (c.name ?? "").trim(); // 例: "山田 花子" or "山田花子"

          // 「山田 花子」なら分割、スペース無しなら雑に半分で分割（仮）
          let lastName = "";
          let firstName = "";
          if (full.includes(" ")) {
            const parts = full.split(/\s+/);
            lastName = parts[0] ?? "";
            firstName = parts.slice(1).join(" ") ?? "";
          } else {
            const mid = Math.ceil(full.length / 2);
            lastName = full.slice(0, mid);
            firstName = full.slice(mid);
          }

          return {
            id: String(c.id), // ルーティングで使う
            number: String(c.id), // いまは顧客番号が無いので id を代用（後で顧客番号追加したら差し替え）
            lastName,
            firstName,
            phone: c.phone ?? "",
          };
        });

        setCustomers(mapped);
      } catch (e) {
        console.error(e);
        alert(e.message || "顧客一覧取得エラー");
      }
    };

    fetchCustomers();
  }, []);

  // デバウンス
  const [debounced, setDebounced] = useState({ qNumber, qName, qPhone });
  useEffect(() => {
    const t = setTimeout(() => setDebounced({ qNumber, qName, qPhone }), 250);
    return () => clearTimeout(t);
  }, [qNumber, qName, qPhone]);

  // フィルタ（OR条件：どれかが一致でOK）
  const results = useMemo(() => {
    const nNum = normalize(debounced.qNumber);
    const nName = normalize(debounced.qName);
    const nPhone = normalize(debounced.qPhone);

    const anyFilled = nNum || nName || nPhone;
    if (!anyFilled) return [];

    return customers
      .filter((c) => {
        const nameFull = `${c.lastName ?? ""}${c.firstName ?? ""}`;
        const byNumber = nNum && normalize(c.number).includes(nNum);
        const byName = nName && normalize(nameFull).includes(nName);
        const byPhone = nPhone && normalize(c.phone).includes(nPhone);
        return byNumber || byName || byPhone;
      })
      .slice(0, 20);
  }, [customers, debounced]);

  // キーボード操作
  useEffect(() => setActiveIdx(0), [results.length]);

  const handlePick = (c) => {
    const id = Number(normalize(c.id));
    if (!Number.isFinite(id)) return alert("顧客IDが不正です");
    navigate(`/customers/${id}`);
  };

  const handleKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIdx];
      picked && handlePick(picked);
    }
  };

  const clearAll = () => {
    setQNumber("");
    setQName("");
    setQPhone("");
  };

  //////////////////////////
  return (
    <DashboardLayout
      header={<div className="text-sm text-gray-600">ログイン中：Staff 01</div>}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-2xl font-bold mb-6">
            顧客検索【顧客番号】or【名前】or【電話】
          </h1>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            {/* 入力3つ */}
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  顧客番号
                </label>
                <input
                  value={qNumber}
                  onChange={(e) => setQNumber(normalize(e.target.value))} //normalize は NFKC してくれるから全角→半角になる
                  onKeyDown={handleKeyDown}
                  placeholder="例）1"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  名前（姓 + 名）
                </label>
                <input
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="例）山田花子 / ﾔﾏﾀﾞﾊﾅｺ"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  電話番号
                </label>
                <input
                  value={qPhone}
                  onChange={(e) => setQPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="例）090-0000-0000"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  type="tel"
                />
              </div>
            </div>

            {/* 操作 */}
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={clearAll}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                クリア
              </button>
            </div>

            {/* 結果 */}
            <div className="mt-4">
              <div className="rounded-xl border">
                <ul className="divide-y max-h-[420px] overflow-auto">
                  {results.length === 0 ? (
                    <li className="text-sm text-gray-400 p-4">検索候補一覧</li>
                  ) : (
                    results.map((c, i) => {
                      const isActive = i === activeIdx;
                      return (
                        <li
                          key={c.id}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => handlePick(c)}
                          className={
                            "cursor-pointer px-4 py-3 grid grid-cols-1 md:grid-cols-[120px_1fr_160px] items-center gap-2 " +
                            (isActive
                              ? "bg-blue-50"
                              : "bg-white hover:bg-gray-50")
                          }
                        >
                          <div className="font-mono text-sm text-gray-700">
                            #{highlight(c.number, qNumber)}
                          </div>
                          <div className="text-gray-900 font-medium">
                            {highlight(`${c.lastName} ${c.firstName}`, qName)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {highlight(c.phone, qPhone)}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
