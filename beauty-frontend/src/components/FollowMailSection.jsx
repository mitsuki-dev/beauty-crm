//一斉メールを送るための画面コンポーネント
// src/components/FollowMailSection.jsx
import React, { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

//value▶︎裏で使う値 label▶︎画面表示する文字
const typeOptions = [
  { value: "birthday", label: "誕生日" },
  { value: "event", label: "イベント" },
  { value: "purchase_follow", label: "購入フォロー" },
];

//フォローメール画面の本体コンポーネント(箱)
export default function FollowMailSection() {
  const [mailType, setMailType] = useState("birthday"); //誕生日
  const [segment, setSegment] = useState("skincare"); // skincare / makeup
  const [targets, setTargets] = useState([]); //APIから取ってきた、メール送信対象の顧客
  const [subject, setSubject] = useState(""); //メールの件名
  const [body, setBody] = useState(""); //メールの本文
  const [isLoading, setIsLoading] = useState(false); //処理中かどうかのフラグ
  const [error, setError] = useState(""); //エラーメッセージ

  // ===== フォロー対象の取得 =====
  useEffect(() => {
    //メール種類を切り替えたら、対象者を取り直す
    const controller = new AbortController(); //通信（fetch）を途中でキャンセルできる ▶︎ 連打で切り替えた際に前の通信が残り、古い結果が上書きしたり、切り替え後に警告アラートが出るのを防ぐため

    async function fetchTargets() {
      setIsLoading(true); //“読み込み中…”表示
      setError(""); //エラー表示を消す
      try {
        const token = //token を localStorage から探す
          localStorage.getItem("access_token") || //どっちか入ってたらそれを使うaccess_token があればそれ,
          localStorage.getItem("rb_token"); //なければ rb_token。両方なければ null

        let url = ""; // ★ 呼び出すURLを mailType によって切り替える

        if (mailType === "purchase_follow") {
          //purchase_follow(購入フォロー) のときだけ segment を使って専用APIを呼ぶ
          const params = new URLSearchParams({ segment }); // skincare / makeup
          url = `${API_BASE_URL}/dashboard/inactive-customers?${params.toString()}`;
        } else {
          //birthday / event のときは従来通り mail_type を使う
          const params = new URLSearchParams({ mail_type: mailType }); //クエリパラメータを組み立てる(mailType が birthday なら ▶︎ mail_type=birthday)
          url = `${API_BASE_URL}/follow-mail/targets?${params.toString()}`;
        }

        const res = await fetch(
          //fetch でAPIを呼ぶ(1.URL を作る 2.認証ヘッダーを付ける（トークンがあるときだけ） 3.signal を渡す)
          url,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}, //バックエンドがログイン済みと判定できる
            signal: controller.signal, //controller.abort() されたら通信を止めるため。
          }
        );

        if (!res.ok) {
          //エラーは例外にする
          const txt = await res.text().catch(() => "");
          throw new Error(`取得に失敗しました (${res.status}) ${txt}`); //res.status は 401 / 500 などの番号
        }

        const data = await res.json(); //サーバーから返ってきたJSONをJSの配列/オブジェクトに
        setTargets(Array.isArray(data) ? data : []); //Array.isArray(data) で配列か確認。 配列なら▶︎targets に入れる
      } catch (e) {
        //失敗したとき
        if (e.name !== "AbortError") {
          //通信キャンセル（Abort）で起きたエラーは無視(e.name === "AbortError" のときは表示しない)
          console.error(e); //本物のエラーだけ表示
          setError("フォロー対象の取得に失敗しました");
          setTargets([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTargets(); //実行

    return () => controller.abort(); //[古い通信の結果が後から来て上書き]を防ぐ
  }, [mailType, segment]);

  // ===== 送信ボタン（今はダミー） =====
  const handleSendPreview = async () => {
    try {
      const token = //token を localStorage から探す
        localStorage.getItem("access_token") || //どっちか入ってたらそれを使うaccess_token があればそれ,
        localStorage.getItem("rb_token"); //なければ rb_token。両方なければ null

      const payload = {
        subject, //件名
        body, //本文
      };

      const res = await fetch(
        //自分にテスト送信APIを呼ぶ（バックエンド：POST /emails/test）
        `${API_BASE_URL}/emails/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`テスト送信に失敗しました (${res.status}) ${txt}`);
      }

      const data = await res.json().catch(() => null);
      alert(data?.message || "自分にテスト送信しました！");
    } catch (e) {
      console.error(e);
      alert("テスト送信に失敗しました（コンソールも確認してね）");
    }
  };

  const handleSendToTargets = async () => {
    try {
      const token = //token を localStorage から探す
        localStorage.getItem("access_token") || //どっちか入ってたらそれを使うaccess_token があればそれ,
        localStorage.getItem("rb_token"); //なければ rb_token。両方なければ null

      //送信対象の customer_id を作る（mailType によって targets の形が違うため分岐する）
      const customerIds = //送信先の顧客ID配列
        mailType === "purchase_follow"
          ? targets.map((t) => t.customer_id) //purchase_follow は customer_id を使う（顧客×カテゴリのtargets）
          : targets.map((t) => t.id); //birthday/event は id が customer_id

      //重複を消す（同じ顧客が複数回入るのを防ぐ）
      const uniqueCustomerIds = Array.from(new Set(customerIds));

      const payload = {
        subject, //件名
        body, //本文
        customer_ids: uniqueCustomerIds, //送信対象の顧客ID
      };

      const res = await fetch(
        //一斉送信APIを呼ぶ（バックエンド：POST /emails/bulk）
        `${API_BASE_URL}/emails/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`一斉送信に失敗しました (${res.status}) ${txt}`);
      }

      const data = await res.json().catch(() => null);
      alert(data?.message || "フォロー対象へ一斉送信しました！");
    } catch (e) {
      console.error(e);
      alert("一斉送信に失敗しました（コンソールも確認してね）");
    }
  };

  const isPurchaseFollow = mailType === "purchase_follow";

  //////////////////////////////////UI/////////////////////////////

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* ヘッダー＋タブ（横並び） */}
      <div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            フォロー対象へ一斉メール
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            誕生日・イベント・購入フォローのお客様に、一括でメールを送信します。
          </p>
        </div>

        {/* メール種別タブ：タイトルの下で横一列 */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMailType(opt.value)}
              className={`rounded-full px-4 py-1 whitespace-nowrap transition ${
                mailType === opt.value
                  ? "bg-pink-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 購入フォローのときだけ、スキンケア / メイク 切り替え */}
      {isPurchaseFollow && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">購入カテゴリ：</span>
          <button
            type="button"
            onClick={() => setSegment("skincare")}
            className={`rounded-full border px-3 py-1 ${
              segment === "skincare"
                ? "border-pink-400 bg-pink-50 text-pink-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            スキンケア（90日〜）
          </button>
          <button
            type="button"
            onClick={() => setSegment("makeup")}
            className={`rounded-full border px-3 py-1 ${
              segment === "makeup"
                ? "border-pink-400 bg-pink-50 text-pink-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            メイクアップ（120日〜）
          </button>
        </div>
      )}

      {/* 本文エリア & 対象リスト：スプリットビュー */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* 左：件名・本文 */}
        <div className="space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              件名
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="例）【Re:Beauty】 いつもご利用ありがとうございます"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              本文
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="例）いつも Re:Beauty をご利用いただきありがとうございます。そろそろお肌のお手入れのタイミングかと思い、ご案内をお送りいたしました。"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              対象件数：{" "}
              <span className="font-semibold text-gray-800">
                {isLoading ? "読み込み中…" : `${targets.length} 件`}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendPreview}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                自分にテスト送信
              </button>
              <button
                type="button"
                onClick={handleSendToTargets}
                className="rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-600 disabled:bg-gray-300"
                disabled={targets.length === 0}
              >
                フォロー対象に一斉送信
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* 右：対象顧客リスト */}
        <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-gray-700">フォロー対象リスト</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">
              {isLoading ? "更新中…" : `${targets.length}件`}
            </span>
          </div>

          <div className="h-[220px] space-y-1 overflow-y-auto rounded-lg bg-white p-2">
            {isLoading && (
              <p className="py-6 text-center text-gray-400">読み込み中です…</p>
            )}

            {!isLoading && targets.length === 0 && (
              <p className="py-6 text-center text-gray-400">
                現在、該当するお客様はいません。
              </p>
            )}

            {!isLoading &&
              targets.map((t) => (
                <div
                  key={mailType === "purchase_follow" ? t.customer_id : t.id}
                  className="flex items-start justify-between rounded-md border border-gray-100 px-2 py-1.5"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-gray-800">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-gray-500">{t.email}</p>
                  </div>
                </div>
              ))}
          </div>

          <p className="mt-2 text-[10px] text-gray-400">
            ※ 対象条件は「上部タブ（誕生日 / イベント / 購入フォロー）」と
            「購入カテゴリ」で切り替え可能
          </p>
        </div>
      </div>
    </section>
  );
}
