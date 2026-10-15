# ADR-0004：部署在 Vercel Hobby

- 狀態：已採用
- 日期：2026-10-15

## 背景

PWA 需要 HTTPS 的正式網址。這是個人專案，不需要後端，只需要放靜態檔案。

## 決策

- 部署到個人 Vercel 帳號 `aaronchuo's projects` 的 **Hobby 方案**（免費）
- 連上 GitHub `AaronChuo/shisa-reunion`：推到 `main` 自動部署正式環境，其他分支與 PR 自動產生預覽網址
- `vercel.json` 的設定：
  - `sw.js` 設成 `max-age=0, must-revalidate`，確保新版本能被發現
  - `/assets/*` 檔名帶雜湊，設成一年 immutable 快取
  - `manifest.webmanifest` 指定正確的 Content-Type

## 影響

- 零成本，預覽網址方便在手機上試新版本
- **Hobby 方案限非商業用途**。若之後要收費、放廣告或商業上架，改用 Pro（或改用下方的替代方案）
- 正式網址是公開的，知道網址的人都能玩

## 替代方案

- **GitHub Pages**：免費、跟 repo 整合，但沒有 PR 預覽，Header 也不好自訂
- **Cloudflare Pages**：免費、可商用、有預覽，是商業化時的首選替代
- **Netlify**：跟 Vercel 相近；手邊 mechanism-puzzle 已經在用 Vercel，統一比較好管理
