// src/components/Dashboard.jsx
import React from "react";
import DashboardLayout from "./DashboardLayout"; //ダッシュボードのレイアウト
import SidebarMenu from "./SidebarMenu"; //左のサイドメニュー
import FollowSuggestions from "./FollowSuggestions"; //フォロー提案一覧
import StaffAccountCard from "./StaffAccountCard"; //スタッフアカウント管理
import FollowMailSection from "./FollowMailSection"; //フォロー一斉メール
import DashboardSummary from "./DashboardSummary"; //上部サマリ

export default function Dashboard() {
  const user = React.useMemo(
    () => JSON.parse(localStorage.getItem("rb_user") || "{}"),
    []
  );

  return (
    <DashboardLayout
      sidebar={<SidebarMenu />}
      header={
        <div className="text-xs text-gray-600">
          ログイン中：
          <span className="font-semibold">{user?.name || "staff"}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 上段：サマリー */}
        <DashboardSummary />

        {/* 下段：2カラム */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FollowSuggestions limit={5} showSeeMore={false} />
          <StaffAccountCard />
          <div className="lg:col-span-2">
            <FollowMailSection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
