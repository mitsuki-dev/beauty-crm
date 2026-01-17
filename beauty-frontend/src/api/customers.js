// src/api/customers.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// トークンキーが複数でも拾えるようにする
const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("rb_token") ||
  localStorage.getItem("accessToken") ||
  "";

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function createCustomer(data) {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "顧客の登録に失敗しました");
  }

  return res.json();
}

// 顧客更新（基本情報＋note）
export async function updateCustomer(customerId, payload) {
  const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "顧客の更新に失敗しました");
  }

  return res.json();
}
