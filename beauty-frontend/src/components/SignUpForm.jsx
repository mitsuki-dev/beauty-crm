import React, { useState } from "react";
import { createCustomer } from "../api/customers";
import DashboardLayout from "./DashboardLayout";

//定数の定義
const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "普通肌", "わからない"];
const YEARS = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - i
); // 今年〜100年前
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const daysInMonth = (y, m) => {
  if (!y || !m) return 31;
  return new Date(Number(y), Number(m), 0).getDate(); // 月は1〜12
};

const SKIN_CONCERNS = [
  "乾燥",
  "ニキビ",
  "吹き出物",
  "くすみ",
  "シミ",
  "シワ",
  "たるみ",
  "毛穴",
];

const IDEAL_SKIN = [
  "保湿",
  "ハリ・ツヤ",
  "透明感",
  "美白ケア",
  "キメ",
  "なめらかさ",
];

//Checkbox コンポーネント
function ChipCheckbox({ label, checked, onChange, name }) {
  return (
    <label className={`cursor-pointer select-none`}>
      <input
        type="checkbox"
        className="peer sr-only"
        name={name}
        value={label}
        checked={checked}
        onChange={onChange}
      />
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition
                       peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700"
      >
        {label}
      </span>
    </label>
  );
}

export default function SignUpForm() {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    furigana: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthdate: "", // 送信用（YYYY-MM-DD）
    email: "",
    phone: "",
    address: "",
    skinType: "",
    skinConcerns: [],
    idealSkin: [],
    concernNote: "", // 「その他（自由記述）」
    idealNote: "", // 「その他（自由記述）」
    sensitiveInfo: "", // 敏感成分・禁止成分（任意）
    emailOptIn: true, //メール送信の同意
  });

  const toggleMulti = (field, value) => {
    setForm((prev) => {
      const has = prev[field].includes(value);
      return {
        ...prev,
        [field]: has
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // バックエンドの /customers が受け取れる形に整形
    // （今は name, kana, phone, email, note だけ使う想定）
    const payload = {
      name: `${form.lastName} ${form.firstName}`.trim(), // 姓＋名をまとめて name に
      kana: form.furigana || null,
      phone: form.phone || null,
      email: form.email || null,
      birthday: form.birthdate || null,
      note: [
        form.address && `住所: ${form.address}`,
        form.skinType && `肌タイプ: ${form.skinType}`,
        form.skinConcerns.length > 0 &&
          `肌悩み: ${form.skinConcerns.join(", ")}`,
        form.concernNote && `悩みメモ: ${form.concernNote}`,
        form.idealSkin.length > 0 && `理想の肌: ${form.idealSkin.join(", ")}`,
        form.idealNote && `理想メモ: ${form.idealNote}`,
        form.sensitiveInfo && `敏感情報: ${form.sensitiveInfo}`,
      ]
        .filter(Boolean)
        .join(" / "),
      email_opt_in: form.emailOptIn,
    };

    try {
      console.log("送信するペイロード:", payload);
      const created = await createCustomer(payload);
      console.log("作成された顧客:", created);

      alert("顧客情報を登録しました！");

      // 必要ならここでフォームを初期化してもOK
      // setForm({ ...初期値... });
    } catch (err) {
      console.error("顧客登録エラー:", err);
      alert("顧客情報の登録に失敗しました…コンソールを確認してください");
    }
  };

  /////////////////////

  return (
    <DashboardLayout
      header={<div className="text-sm text-gray-600">ログイン中：Staff 01</div>}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-2xl font-bold tracking-tight">新規登録</h1>
          <p className="mt-1 text-sm text-gray-600">
            必須項目を入力し、「登録する」を押してください。
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-6 md:grid-cols-2"
          >
            {/* ① 個人情報登録 */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">① 個人情報登録</h2>
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">
                      姓 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="山田"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      名 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="花子"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">フリガナ</label>
                  <input
                    type="text"
                    name="furigana"
                    value={form.furigana}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ヤマダ ハナコ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    生年月日 <span className="text-red-600">*</span>
                  </label>

                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {/* 年 */}
                    <select
                      name="birthYear"
                      value={form.birthYear}
                      onChange={(e) => {
                        const birthYear = e.target.value;
                        setForm((prev) => {
                          const maxDay = daysInMonth(
                            birthYear,
                            prev.birthMonth
                          );
                          const birthDay =
                            prev.birthDay && Number(prev.birthDay) > maxDay
                              ? String(maxDay)
                              : prev.birthDay;

                          const birthdate =
                            birthYear && prev.birthMonth && birthDay
                              ? `${birthYear}-${String(
                                  prev.birthMonth
                                ).padStart(2, "0")}-${String(birthDay).padStart(
                                  2,
                                  "0"
                                )}`
                              : "";

                          return { ...prev, birthYear, birthDay, birthdate };
                        });
                      }}
                      required
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">年</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>

                    {/* 月 */}
                    <select
                      name="birthMonth"
                      value={form.birthMonth}
                      onChange={(e) => {
                        const birthMonth = e.target.value;
                        setForm((prev) => {
                          const maxDay = daysInMonth(
                            prev.birthYear,
                            birthMonth
                          );
                          const birthDay =
                            prev.birthDay && Number(prev.birthDay) > maxDay
                              ? String(maxDay)
                              : prev.birthDay;

                          const birthdate =
                            prev.birthYear && birthMonth && birthDay
                              ? `${prev.birthYear}-${String(
                                  birthMonth
                                ).padStart(2, "0")}-${String(birthDay).padStart(
                                  2,
                                  "0"
                                )}`
                              : "";

                          return { ...prev, birthMonth, birthDay, birthdate };
                        });
                      }}
                      required
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">月</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    {/* 日 */}
                    <select
                      name="birthDay"
                      value={form.birthDay}
                      onChange={(e) => {
                        const birthDay = e.target.value;
                        setForm((prev) => {
                          const birthdate =
                            prev.birthYear && prev.birthMonth && birthDay
                              ? `${prev.birthYear}-${String(
                                  prev.birthMonth
                                ).padStart(2, "0")}-${String(birthDay).padStart(
                                  2,
                                  "0"
                                )}`
                              : "";

                          return { ...prev, birthDay, birthdate };
                        });
                      }}
                      required
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">日</option>
                      {Array.from(
                        {
                          length: daysInMonth(form.birthYear, form.birthMonth),
                        },
                        (_, i) => i + 1
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    年月日を選択してください
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    メールアドレス <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@mail.com"
                  />
                </div>

                <div className="mt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      name="emailOptIn"
                      checked={form.emailOptIn}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          emailOptIn: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      お誕生日・イベント・購入フォローなどの
                      ご案内メールを受け取ることに同意します
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    電話番号（任意）
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="090-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    住所（任意）
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="東京都〇〇区…"
                  />
                </div>
              </div>
            </section>

            {/* ② 美容プロフィール */}
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                ② 美容プロフィール（チェックボックス）
              </h2>

              <div className="mt-4 space-y-5">
                {/* お肌タイプ */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    お肌タイプ
                  </label>
                  <select
                    name="skinType"
                    value={form.skinType}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {SKIN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* お肌悩み（複数選択可） */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    お肌悩み（複数選択可）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_CONCERNS.map((c) => (
                      <ChipCheckbox
                        key={c}
                        name="skinConcerns"
                        label={c}
                        checked={form.skinConcerns.includes(c)}
                        onChange={() => toggleMulti("skinConcerns", c)}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    name="concernNote"
                    value={form.concernNote}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="その他・自由記述"
                  />
                </div>

                {/* 理想の肌感（複数選択可） */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    理想の肌感（複数選択可）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {IDEAL_SKIN.map((i) => (
                      <ChipCheckbox
                        key={i}
                        name="idealSkin"
                        label={i}
                        checked={form.idealSkin.includes(i)}
                        onChange={() => toggleMulti("idealSkin", i)}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    name="idealNote"
                    value={form.idealNote}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="その他・自由記述"
                  />
                </div>

                {/* 敏感成分 */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    敏感情報・禁止成分（任意）
                  </label>
                  <textarea
                    name="sensitiveInfo"
                    value={form.sensitiveInfo}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="刺激になりやすい成分、避けたい成分（例：アルコール、香料）"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    個人情報の取扱いに同意の上、必要な範囲でご記入ください。
                  </p>
                </div>
              </div>
            </section>

            {/* 送信エリア（全幅） */}
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                戻る
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                登録する
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
