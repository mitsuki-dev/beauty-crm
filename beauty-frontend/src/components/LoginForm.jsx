import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || "ログインに失敗しました");
      }

      // token保存
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("rb_token", data.access_token); // PrivateRouteが見る方
      localStorage.setItem("rb_user", JSON.stringify(data.user));

      // nameがあればname、なければemail
      const displayName = data?.user?.name || data?.user?.email || email.trim();
      localStorage.setItem("rb_staff_name", displayName);

      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="mb-10 text-3xl font-bold text-gray-800 tracking-wide">
        Re:Beauty
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col items-center space-y-4"
      >
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 focus:outline-none"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-pink-500 py-2 text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
