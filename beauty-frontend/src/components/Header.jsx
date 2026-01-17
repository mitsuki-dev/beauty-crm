console.log("Header.jsx is used");

import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className="text-lg font-semibold hover:opacity-80"
          aria-label="ホームへ戻る"
        >
          Re:Beauty
          <span className="ml-2 text-sm font-normal text-gray-500">
            スタッフダッシュボード
          </span>
        </Link>

        <div className="text-sm text-gray-600">ログイン中：Staff 01</div>
      </div>
    </header>
  );
}

export default Header;
