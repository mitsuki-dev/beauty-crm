// src/components/DashboardSummary.jsx
import React, { useEffect, useState } from "react";

import { API_BASE_URL } from "../api/config";

function SummaryCard({ title, value, emphasize = false }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div
        className={`mt-2 text-3xl font-bold ${emphasize ? "text-red-600" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardSummary() {
  const [todayVisits, setTodayVisits] = useState(0);
  const [monthlyNew, setMonthlyNew] = useState(0);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("rb_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 本日の来店数
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTodayVisits() {
      try {
        const res = await fetch(`${API_BASE_URL}/visits/today-count`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setTodayVisits(data.count ?? 0);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    }

    fetchTodayVisits();
    return () => controller.abort();
  }, []);

  // 今月の新規
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMonthlyNew() {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/monthly-new-count`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setMonthlyNew(data.count ?? 0);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    }

    fetchMonthlyNew();
    return () => controller.abort();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SummaryCard title="本日の来店数" value={todayVisits} />
      <SummaryCard title="今月の新規" value={monthlyNew} />
    </div>
  );
}
