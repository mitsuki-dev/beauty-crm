// src/components/SidebarMenu.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const menuItems = [
  { label: "ダッシュボード", to: "/dashboard" },
  { label: "ホーム", to: "/home" },
  { label: "顧客登録", to: "/customers/new" },
  { label: "顧客検索", to: "/customers/search" },
];

export default function SidebarMenu() {
  const navigate = useNavigate();
  const handleLogout = () => {
    const ok = window.confirm("本当にログアウトしますか？");
    if (!ok) return;
    //ログイン情報を全部消す
    localStorage.removeItem("access_token");
    localStorage.removeItem("rb_token");
    localStorage.removeItem("rb_staff_name");
    localStorage.removeItem("rb_user");

    //ログイン画面へ//
    navigate("/login", { replace: true });
  };

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
              isActive
                ? "bg-pink-50 font-semibold text-pink-600"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}

      {/* ログアウト */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-pink-600 hover:bg-pink-50"
      >
        ログアウト
      </button>
    </nav>
  );
}
