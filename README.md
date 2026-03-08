# beauty-crm

## 概要
美容業界向け顧客管理・フォロー提案システムです。  
顧客情報・来店履歴・購入履歴を管理し、商品カテゴリ別の使用サイクルからフォロー対象を自動抽出します。

## 使用技術
- Frontend: React / Vite
- Backend: FastAPI / Python
- Database: PostgreSQL（開発時SQLite使用）
- Auth: JWT認証（OAuth2）
- Deploy: PythonAnywhere
- Version Control: Git / GitHub

## 主な機能
- ログイン機能（JWT認証）
- 管理者 / スタッフ権限分離
- 顧客CRUD
- 来店履歴登録
- カテゴリ別フォロー抽出機能
- フォロー対象者一覧表示

## 工夫した点
- 商品カテゴリ（skincare / makeup）ごとにフォロー日数を分離設計
- follow_due_date をDB側で自動算出
- mail_typeごとにAPI分離設計
- Swaggerで動作確認後にフロント接続
- デプロイ環境での404問題をHashRouter導入で解決

## URL
- (https://mitsukidev.pythonanywhere.com)
- メールアドレス: sample_user@example.com
- パスワード: sample1234
- ※デモ環境のため、データは変更される可能性があります。
