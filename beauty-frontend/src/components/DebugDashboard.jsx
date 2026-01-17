import React from "react";
import { authGet } from "../lib/api";

export default function Dashboard() {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    // 接続テスト（任意）: /status を叩いてみる
    authGet("/status")
      .then((r) => setText(JSON.stringify(r)))
      .catch(() => setText("OK"));
  }, []);

  const user = JSON.parse(localStorage.getItem("rb_user") || "{}");

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold">ダッシュボード</h2>
      <p className="mt-2 text-gray-600">
        こんにちは、{user?.name || "スタッフ"} さん！
      </p>
      <pre className="mt-4 rounded-md bg-gray-50 p-3 text-sm">{text}</pre>
    </div>
  );
}
