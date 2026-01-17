import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { updateCustomer } from "../api/customers";

import { API_BASE_URL } from "../api/config";

//////////// 共通のコンポーネント ///////////
function SectionCard({ title, children, className = "", right }) {
  return (
    <section
      className={`rounded-2xl border bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// チップ（複数選択）共通
function ChipMulti({ options, value, onChange }) {
  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={
              "rounded-full border px-3 py-1.5 text-sm transition " +
              (active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-gray-50")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/////「購入品・サービス」を複数選択のチップUI（カテゴリ付き） //////
function MultiSelectChips({ value, onChange, optionsByCategory }) {
  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <span className="block text-xs text-gray-600">購入品・サービス</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
        >
          クリア
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(optionsByCategory).map(([category, items]) => (
          <div key={category}>
            <div className="text-xs font-semibold text-gray-700 mb-1">
              {category}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const active = value.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    className={
                      "rounded-full border px-3 py-1 text-sm transition " +
                      (active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50")
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {value.length > 0 ? `選択中：${value.join(" / ")}` : "選択なし"}
      </div>
    </div>
  );
}

////// 行コンポーネント：通常表示 or 編集モードを切り替え /////
function VisitRow({
  v,
  isEditing,
  draft,
  onStartEdit,
  onChange,
  onSave,
  onCancel,
  onDelete,
  staffOptions,
  productOptions,
}) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-[130px_1fr_1fr_auto] items-start gap-2 rounded-lg border bg-gray-50 px-3 py-2">
        <div>
          <input
            type="text"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
            className="w-full rounded-md border px-2 py-1"
            placeholder="2025/10/16"
          />
        </div>

        <div>
          <select
            value={draft.staff_id ?? ""}
            onChange={(e) => onChange({ ...draft, staff_id: e.target.value })}
            className="w-full rounded-md border px-2 py-1 bg-white"
          >
            <option value="">— 選択してください —</option>
            {staffOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <MultiSelectChips
            value={draft.items}
            onChange={(items) => onChange({ ...draft, items })}
            optionsByCategory={productOptions}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => onDelete(v.id)}
            className="rounded-md border border-red-500 text-red-500 px-3 py-1.5 text-sm hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[130px_1fr_1fr_auto] items-center gap-2 rounded-lg border px-3 py-2">
      <div className="text-sm text-gray-700">{v.date}</div>
      <div className="text-sm text-gray-700">
        {v.staff_name ? `【担当者】${v.staff_name}` : "【担当者】"}
      </div>
      <div className="text-sm text-gray-700">
        {v.items?.length
          ? `【購入品・サービス】 ${v.items.join(" / ")}`
          : "【購入品・サービス】"}
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onStartEdit(v)}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(v.id)}
          className="rounded-md border border-red-500 text-red-500 px-3 py-1 text-sm hover:bg-red-50 transition-colors duration-200"
        >
          削除
        </button>
      </div>
    </div>
  );
}

/////////////////////// note を分解/生成 ///////////////////////
const parseNote = (note) => {
  const out = {};
  if (!note) return out;

  note.split(" / ").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = value;
  });
  return out;
};

const splitList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const buildNote = (e) =>
  [
    e.address && `住所: ${e.address}`,
    e.skinType && `肌タイプ: ${e.skinType}`,
    e.skinConcerns?.length ? `肌悩み: ${e.skinConcerns.join(", ")}` : null,
    e.concernNote && `悩みメモ: ${e.concernNote}`,
    e.idealSkin?.length ? `理想の肌: ${e.idealSkin.join(", ")}` : null,
    e.idealNote && `理想メモ: ${e.idealNote}`,
    e.sensitiveInfo && `敏感情報: ${e.sensitiveInfo}`,
    e.memo && `メモ: ${e.memo}`,
  ]
    .filter(Boolean)
    .join(" / ");

// 美容プロフィール選択肢（SignUpと同じ）
const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "普通肌", "わからない"];
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

//////////////////顧客詳細UI/////////////////////
export default function CustomerDetail() {
  const { id } = useParams();

  // スタッフ一覧（DBから取得）
  const [staffs, setStaffs] = useState([]);
  const [staffsLoading, setStaffsLoading] = useState(false);
  const [staffsError, setStaffsError] = useState("");

  // select 用 options（value=staff_id, label=表示名）
  const staffOptions = useMemo(() => {
    return staffs.map((s) => ({ value: s.id, label: s.name }));
  }, [staffs]);

  // 商品カテゴリ・選択肢
  const productOptions = useMemo(
    () => ({
      スキンケア: [
        "クレンジング",
        "洗顔",
        "導入美容液",
        "化粧水",
        "美容液",
        "乳液",
        "クリーム",
        "パック",
      ],
      メイクアップ: [
        "下地",
        "ファンデーション",
        "パウダー",
        "アイブロウ",
        "アイシャドウ",
        "マスカラ",
        "アイライナー",
        "リップ",
      ],
      その他: [
        "スキンケアサンプル",
        "メイクアップサンプル",
        "タッチアップ",
        "マッサージ",
      ],
    }),
    []
  );

  // 顧客
  const [customer, setCustomer] = useState({
    id: "",
    name: "",
    kana: "",
    phone: "",
    email: "",
    birthday: "",
    note: "",
    email_opt_in: true,
  });

  // 顧客編集
  const [isCustEditing, setIsCustEditing] = useState(false);
  const [custSaving, setCustSaving] = useState(false);
  const [custEdit, setCustEdit] = useState({
    birthday: "",
    email: "",
    phone: "",
    emailOptIn: true,
    address: "",
    memo: "",
    skinType: "",
    skinConcerns: [],
    idealSkin: [],
    concernNote: "",
    idealNote: "",
    sensitiveInfo: "",
  });

  const fullName = useMemo(() => customer.name || "", [customer.name]);

  // スタッフ取得（GET /staffs）
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStaffs() {
      setStaffsLoading(true);
      setStaffsError("");

      try {
        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("rb_token");

        const res = await fetch(`${API_BASE_URL}/staffs/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`スタッフ取得に失敗しました（${res.status}）${txt}`);
        }

        const data = await res.json();
        setStaffs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setStaffsError(e.message || "スタッフ取得エラー");
        }
      } finally {
        setStaffsLoading(false);
      }
    }

    fetchStaffs();
    return () => controller.abort();
  }, []);

  // 顧客取得（GET /customers/{id}）
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function fetchCustomer() {
      try {
        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("rb_token");

        const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`顧客取得に失敗しました（${res.status}）${txt}`);
        }

        const data = await res.json();
        setCustomer(data);

        // note を分解して編集stateに初期セット
        const m = parseNote(data.note);
        setCustEdit({
          birthday: data.birthday || "",
          email: data.email || "",
          phone: data.phone || "",
          emailOptIn: !!data.email_opt_in,
          address: m["住所"] || "",
          memo: m["メモ"] || "",
          skinType: m["肌タイプ"] || "",
          skinConcerns: splitList(m["肌悩み"]),
          idealSkin: splitList(m["理想の肌"]),
          concernNote: m["悩みメモ"] || "",
          idealNote: m["理想メモ"] || "",
          sensitiveInfo: m["敏感情報"] || "",
        });

        setIsCustEditing(false);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          alert(e.message || "顧客取得エラー");
        }
      }
    }

    fetchCustomer();
    return () => controller.abort();
  }, [id]);

  const startCustomerEdit = () => setIsCustEditing(true);

  const cancelCustomerEdit = () => {
    // customer.note から戻す
    const m = parseNote(customer.note);
    setCustEdit({
      birthday: customer.birthday || "",
      email: customer.email || "",
      phone: customer.phone || "",
      emailOptIn: !!customer.email_opt_in,
      address: m["住所"] || "",
      memo: m["メモ"] || "",
      skinType: m["肌タイプ"] || "",
      skinConcerns: splitList(m["肌悩み"]),
      idealSkin: splitList(m["理想の肌"]),
      concernNote: m["悩みメモ"] || "",
      idealNote: m["理想メモ"] || "",
      sensitiveInfo: m["敏感情報"] || "",
    });
    setIsCustEditing(false);
  };

  const saveCustomer = async () => {
    try {
      setCustSaving(true);

      const payload = {
        birthday: custEdit.birthday || null,
        email: custEdit.email || null,
        phone: custEdit.phone || null,
        email_opt_in: custEdit.emailOptIn,
        note: buildNote(custEdit) || null,
      };

      const updated = await updateCustomer(Number(customer.id || id), payload);
      setCustomer(updated);

      // 更新後のnoteで編集stateも同期
      const m = parseNote(updated.note);
      setCustEdit((prev) => ({
        ...prev,
        birthday: updated.birthday || "",
        email: updated.email || "",
        phone: updated.phone || "",
        emailOptIn: !!updated.email_opt_in,
        address: m["住所"] || "",
        memo: m["メモ"] || "",
        skinType: m["肌タイプ"] || "",
        skinConcerns: splitList(m["肌悩み"]),
        idealSkin: splitList(m["理想の肌"]),
        concernNote: m["悩みメモ"] || "",
        idealNote: m["理想メモ"] || "",
        sensitiveInfo: m["敏感情報"] || "",
      }));

      setIsCustEditing(false);
      alert("顧客情報を更新しました！");
    } catch (e) {
      console.error(e);
      alert(e.message || "顧客情報の更新に失敗しました");
    } finally {
      setCustSaving(false);
    }
  };

  const noteMap = useMemo(() => parseNote(customer.note), [customer.note]);

  // 来店記録（ここから下は今のまま）
  const [visits, setVisits] = useState([]);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitError, setVisitError] = useState("");

  // 来店履歴取得（GET /visits/by-customer/{id}）
  useEffect(() => {
    if (!id) return;

    const fetchVisits = async () => {
      try {
        setVisitLoading(true);
        setVisitError("");

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("rb_token");

        const res = await fetch(`${API_BASE_URL}/visits/by-customer/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error("来店履歴の取得に失敗しました");
        }

        const data = await res.json();

        const mapped = data.map((v) => {
          const items = (v.items ?? []).map((it) => {
            return `${it.category}${
              it.product_name ? `：${it.product_name}` : ""
            }`;
          });

          return {
            id: v.id,
            date: (v.visit_date ?? "").replaceAll("-", "/"),
            staff_id: v.staff_id ?? "",
            staff_name:
              staffs.find((s) => Number(s.id) === Number(v.staff_id))?.name ||
              "",
            items,
            memo: v.memo ?? "",
            _raw: v,
          };
        });

        setVisits(mapped);
      } catch (e) {
        console.error(e);
        setVisitError(e.message);
      } finally {
        setVisitLoading(false);
      }
    };

    fetchVisits();
  }, [id, staffs]);

  // 新規登録用フォーム
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({
    date: "",
    staff_id: "",
    items: [],
  });
  // 行内編集用ステート
  const [editingId, setEditingId] = useState(null);
  const [rowDraft, setRowDraft] = useState({
    id: null,
    date: "",
    staff_id: "",
    items: [],
    memo: "",
  });

  const todaySlash = () =>
    new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  const openAdd = () => {
    setEditingId(null);
    setRowDraft({ id: null, date: "", staff_id: "", items: [], memo: "" });
    setAddDraft({ date: todaySlash(), staff_id: "", items: [] });
    setIsAddOpen(true);
  };

  const saveAdd = async () => {
    if (!addDraft.date?.trim()) return alert("日付を入力してください");
    if (!String(addDraft.staff_id || "").trim())
      return alert("担当者を選択してください");
    if (!addDraft.items?.length)
      return alert("購入品・サービスを1点以上選択してください");

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("rb_token");

    const visitDate = addDraft.date.replaceAll("/", "-");

    const mapCategory = (catLabel) => {
      if (catLabel === "スキンケア") return "skincare";
      if (catLabel === "メイクアップ") return "makeup";
      if (catLabel === "その他") return "other";
      return "other";
    };

    const findCategoryLabel = (productName) => {
      for (const [catLabel, names] of Object.entries(productOptions)) {
        if (names.includes(productName)) return catLabel;
      }
      return "その他";
    };

    const apiItems = addDraft.items.map((name) => {
      const catLabel = findCategoryLabel(name);
      return {
        category: mapCategory(catLabel),
        product_name: name,
        note: null,
      };
    });

    const payload = {
      customer_id: Number(id),
      visit_date: visitDate,
      memo: null,
      staff_id: Number(addDraft.staff_id),
      items: apiItems,
    };

    try {
      setVisitLoading(true);
      setVisitError("");

      const res = await fetch(`${API_BASE_URL}/visits/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`来店登録に失敗しました（${res.status}）${txt}`);
      }

      const saved = await res.json();

      const uiItems = (saved.items ?? []).map((it) => {
        return `${it.category}${it.product_name ? `：${it.product_name}` : ""}`;
      });

      const staffName =
        staffs.find((s) => s.id === Number(addDraft.staff_id))?.name || "";

      const uiVisit = {
        id: saved.id,
        date: (saved.visit_date ?? "").replaceAll("-", "/"),
        staff_id: Number(addDraft.staff_id),
        staff_name: staffName,
        items: uiItems,
        memo: saved.memo ?? "",
        _raw: saved,
      };

      setVisits((prev) => [uiVisit, ...prev]);
      setIsAddOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.message || "来店登録エラー");
    } finally {
      setVisitLoading(false);
    }
  };

  const startRowEdit = (v) => {
    setIsAddOpen(false);
    setEditingId(v.id);

    const itemsArray = Array.isArray(v.items)
      ? v.items.map((s) => {
          const str = String(s);
          return str.includes("：") ? str.split("：").pop().trim() : str.trim();
        })
      : [];

    setRowDraft({
      id: v.id,
      date: v.date,
      staff_id: String(v.staff_id ?? ""),
      items: itemsArray,
      memo: v.memo ?? "",
    });
  };

  const saveRowEdit = async () => {
    if (!rowDraft.date?.trim()) return alert("日付を入力してください");
    if (!String(rowDraft.staff_id || "").trim())
      return alert("担当者を選択してください");
    if (!rowDraft.items?.length)
      return alert("購入品・サービスを1点以上選択してください");

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("rb_token");

    const visitDate = rowDraft.date.replaceAll("/", "-");

    const mapCategory = (catLabel) => {
      if (catLabel === "スキンケア") return "skincare";
      if (catLabel === "メイクアップ") return "makeup";
      if (catLabel === "その他") return "other";
      return "skincare";
    };

    const findCategoryLabel = (productName) => {
      for (const [catLabel, names] of Object.entries(productOptions)) {
        if (names.includes(productName)) return catLabel;
      }
      return "その他";
    };

    const apiItems = rowDraft.items.map((name) => {
      const catLabel = findCategoryLabel(name);
      return {
        category: mapCategory(catLabel),
        product_name: name,
        note: null,
      };
    });

    const payload = {
      visit_date: visitDate,
      memo: rowDraft.memo ?? null,
      staff_id: Number(rowDraft.staff_id),
      items: apiItems,
    };

    try {
      setVisitLoading(true);
      setVisitError("");

      const res = await fetch(`${API_BASE_URL}/visits/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`編集に失敗しました（${res.status}）${txt}`);
      }

      const saved = await res.json();

      const uiItems = (saved.items ?? []).map((it) => {
        return `${it.category}${it.product_name ? `：${it.product_name}` : ""}`;
      });

      const staffName =
        staffs.find((s) => s.id === Number(rowDraft.staff_id))?.name || "";

      const uiVisit = {
        id: saved.id,
        date: (saved.visit_date ?? "").replaceAll("-", "/"),
        staff_id: Number(rowDraft.staff_id),
        staff_name: staffName,
        items: uiItems,
        memo: saved.memo ?? "",
        _raw: saved,
      };

      setVisits((prev) => prev.map((v) => (v.id === editingId ? uiVisit : v)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "来店記録の編集に失敗しました");
    } finally {
      setVisitLoading(false);
    }
  };

  const deleteVisit = async (visitId) => {
    const ok = window.confirm("削除してもよろしいですか？");
    if (!ok) return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("rb_token");

    try {
      const res = await fetch(`${API_BASE_URL}/visits/${visitId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`削除に失敗しました (${res.status}) ${txt}`);
      }

      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (e) {
      console.error(e);
      alert(e.message || "来店記録の削除に失敗しました");
    }
  };

  const cancelRowEdit = () => setEditingId(null);

  /////顧客データ表示画面レイアウト//////
  return (
    <DashboardLayout
      header={<div className="text-sm text-gray-600">ログイン中：Staff 01</div>}
    >
      <div className="space-y-6">
        <header className="rounded-2xl border bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              顧客番号：{customer.id} ／ 名前：{fullName}
            </h1>

            {!isCustEditing ? (
              <button
                onClick={startCustomerEdit}
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                基本情報を編集
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveCustomer}
                  disabled={custSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={cancelCustomerEdit}
                  disabled={custSaving}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <SectionCard title="① 基本情報">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  生年月日（YYYY-MM-DD）
                </label>
                <input
                  type="text"
                  value={
                    isCustEditing ? custEdit.birthday : customer.birthday ?? ""
                  }
                  onChange={(e) =>
                    setCustEdit((p) => ({ ...p, birthday: e.target.value }))
                  }
                  readOnly={!isCustEditing}
                  className={
                    "mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 " +
                    (!isCustEditing ? "bg-gray-50" : "")
                  }
                  placeholder="1990-01-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={isCustEditing ? custEdit.email : customer.email ?? ""}
                  onChange={(e) =>
                    setCustEdit((p) => ({ ...p, email: e.target.value }))
                  }
                  readOnly={!isCustEditing}
                  className={
                    "mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 " +
                    (!isCustEditing ? "bg-gray-50" : "")
                  }
                  placeholder="example@mail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">電話番号</label>
                <input
                  type="tel"
                  value={isCustEditing ? custEdit.phone : customer.phone ?? ""}
                  onChange={(e) =>
                    setCustEdit((p) => ({ ...p, phone: e.target.value }))
                  }
                  readOnly={!isCustEditing}
                  className={
                    "mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 " +
                    (!isCustEditing ? "bg-gray-50" : "")
                  }
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  住所（任意）
                </label>
                <input
                  type="text"
                  value={
                    isCustEditing ? custEdit.address : noteMap["住所"] ?? ""
                  }
                  onChange={(e) =>
                    setCustEdit((p) => ({ ...p, address: e.target.value }))
                  }
                  readOnly={!isCustEditing}
                  className={
                    "mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 " +
                    (!isCustEditing ? "bg-gray-50" : "")
                  }
                  placeholder="東京都〇〇区…"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={
                    isCustEditing
                      ? custEdit.emailOptIn
                      : !!customer.email_opt_in
                  }
                  onChange={(e) =>
                    setCustEdit((p) => ({ ...p, emailOptIn: e.target.checked }))
                  }
                  disabled={!isCustEditing}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>ご案内メールを受け取ることに同意</span>
              </label>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="美容プロフィール">
              {!isCustEditing ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">肌タイプ</div>
                    <div className="mt-1">{noteMap["肌タイプ"] || "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">肌悩み</div>
                    <div className="mt-1">
                      {noteMap["肌悩み"] ? (
                        <div className="flex flex-wrap gap-2">
                          {splitList(noteMap["肌悩み"]).map((x) => (
                            <span
                              key={x}
                              className="rounded-full border px-3 py-1 text-xs"
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </div>
                    {noteMap["悩みメモ"] && (
                      <div className="mt-2 text-xs text-gray-600">
                        {noteMap["悩みメモ"]}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">理想の肌</div>
                    <div className="mt-1">
                      {noteMap["理想の肌"] ? (
                        <div className="flex flex-wrap gap-2">
                          {splitList(noteMap["理想の肌"]).map((x) => (
                            <span
                              key={x}
                              className="rounded-full border px-3 py-1 text-xs"
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </div>
                    {noteMap["理想メモ"] && (
                      <div className="mt-2 text-xs text-gray-600">
                        {noteMap["理想メモ"]}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">敏感情報</div>
                    <div className="mt-1 whitespace-pre-wrap">
                      {noteMap["敏感情報"] || "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      肌タイプ
                    </label>
                    <select
                      value={custEdit.skinType}
                      onChange={(e) =>
                        setCustEdit((p) => ({ ...p, skinType: e.target.value }))
                      }
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

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      肌悩み（複数選択）
                    </label>
                    <ChipMulti
                      options={SKIN_CONCERNS}
                      value={custEdit.skinConcerns}
                      onChange={(arr) =>
                        setCustEdit((p) => ({ ...p, skinConcerns: arr }))
                      }
                    />
                    <input
                      type="text"
                      value={custEdit.concernNote}
                      onChange={(e) =>
                        setCustEdit((p) => ({
                          ...p,
                          concernNote: e.target.value,
                        }))
                      }
                      className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="その他・自由記述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      理想の肌（複数選択）
                    </label>
                    <ChipMulti
                      options={IDEAL_SKIN}
                      value={custEdit.idealSkin}
                      onChange={(arr) =>
                        setCustEdit((p) => ({ ...p, idealSkin: arr }))
                      }
                    />
                    <input
                      type="text"
                      value={custEdit.idealNote}
                      onChange={(e) =>
                        setCustEdit((p) => ({
                          ...p,
                          idealNote: e.target.value,
                        }))
                      }
                      className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="その他・自由記述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      敏感情報（任意）
                    </label>
                    <textarea
                      rows={3}
                      value={custEdit.sensitiveInfo}
                      onChange={(e) =>
                        setCustEdit((p) => ({
                          ...p,
                          sensitiveInfo: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="刺激になりやすい成分、避けたい成分（例：アルコール、香料）"
                    />
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="メモ">
              <textarea
                value={isCustEditing ? custEdit.memo : noteMap["メモ"] ?? ""}
                onChange={(e) =>
                  setCustEdit((p) => ({ ...p, memo: e.target.value }))
                }
                readOnly={!isCustEditing}
                rows={10}
                className={
                  "w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 " +
                  (!isCustEditing ? "bg-gray-50" : "")
                }
                placeholder="接客時の気づき、肌状態、好み、注意点 など"
              />
            </SectionCard>
          </div>
        </div>

        <SectionCard title="来店記録・購入品" className="mt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              <span>🔹</span> 登録
            </button>
          </div>

          {visitLoading && (
            <div className="text-sm text-gray-500">読み込み中...</div>
          )}
          {visitError && (
            <div className="text-sm text-red-500">{visitError}</div>
          )}

          {isAddOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-[130px_1fr_1fr_auto] items-start gap-2 rounded-lg border bg-gray-50 p-3">
              <div>
                <label className="block text-xs text-gray-600">日付</label>
                <input
                  type="text"
                  value={addDraft.date}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, date: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border px-2 py-1"
                  placeholder="2025/10/16"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600">担当者</label>
                <select
                  value={addDraft.staff_id}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, staff_id: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border px-2 py-1 bg-white"
                >
                  <option value="">
                    {staffsLoading ? "読み込み中..." : "— 選択してください —"}
                  </option>
                  {staffOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {staffsError && (
                  <p className="mt-1 text-xs text-red-500">{staffsError}</p>
                )}
              </div>

              <div>
                <MultiSelectChips
                  value={addDraft.items}
                  onChange={(items) => setAddDraft((d) => ({ ...d, items }))}
                  optionsByCategory={productOptions}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveAdd}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {visits.map((v) => (
              <VisitRow
                key={v.id}
                v={v}
                isEditing={editingId === v.id}
                draft={editingId === v.id ? rowDraft : v}
                onStartEdit={startRowEdit}
                onChange={setRowDraft}
                onSave={saveRowEdit}
                onCancel={cancelRowEdit}
                onDelete={deleteVisit}
                staffOptions={staffOptions}
                productOptions={productOptions}
              />
            ))}

            {[...Array(3)].map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="grid grid-cols-[130px_1fr_1fr_auto] items-center gap-2 rounded-lg border px-3 py-3 text-gray-300"
              >
                <div>— — —</div>
                <div>— — —</div>
                <div>— — —</div>
                <div>
                  <button
                    disabled
                    className="rounded-md border px-3 py-1 text-sm opacity-40"
                  >
                    編集
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
