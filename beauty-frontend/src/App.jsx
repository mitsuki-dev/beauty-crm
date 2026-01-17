// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomeScreen from "./components/HomeScreen"; //ホーム画面
import LoginForm from "./components/LoginForm"; //ログイン画面
import Dashboard from "./components/Dashboard"; //ダッシュボード画面
import SignUpForm from "./components/SignUpForm"; // 新規顧客登録画面
import CustomerSearchSplit from "./components/CustomerSearch"; //顧客検索画面
import CustomerDetail from "./components/CustomerDetail"; //顧客情報画面

// ログインしているかどうかをチェックする共通コンポーネント
function PrivateRoute({ children }) {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("rb_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const hasToken =
    localStorage.getItem("access_token") || localStorage.getItem("rb_token");

  return (
    <BrowserRouter>
      <Routes>
        {/* トップパス：トークン有無で /home or /login に振り分け */}
        <Route
          path="/"
          element={
            hasToken ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ログイン画面 */}
        <Route path="/login" element={<LoginForm />} />

        {/* ホーム画面（要ログイン） */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomeScreen />
            </PrivateRoute>
          }
        />

        {/* ✅ ダッシュボード画面（要ログイン） */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ✅ 新規顧客登録（要ログイン） */}
        <Route
          path="/customers/new"
          element={
            <PrivateRoute>
              <SignUpForm />
            </PrivateRoute>
          }
        />

        {/* ✅ 顧客検索画面（要ログイン） */}
        <Route
          path="/customers/search"
          element={
            <PrivateRoute>
              <CustomerSearchSplit />
            </PrivateRoute>
          }
        />

        {/* ✅ 顧客詳細画面（要ログイン） */}
        <Route
          path="/customers/:id"
          element={
            <PrivateRoute>
              <CustomerDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
