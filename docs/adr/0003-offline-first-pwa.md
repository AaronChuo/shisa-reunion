# ADR-0003：以離線優先的 PWA 發佈

- 狀態：已採用
- 日期：2026-10-15

## 背景

這款遊戲主要給孩子在平板或手機上玩，常在車上、旅途中、沒有網路的地方玩，所以要能加到主畫面、完全離線。Artifact 環境不支援 service worker，所以必須放到正式網址上。

## 決策

- 用 **vite-plugin-pwa**（Workbox generateSW）**預先快取全部檔案**：程式、Worker、字型、圖示、manifest
- 更新採 **prompt 模式**：新版本下載好後，在地圖畫面詢問玩家，不會在解題途中自動重新載入
- **中文字型自託管並子集化**：`pnpm fonts` 只保留遊戲用到的字（約 140 KB／字重），單元測試確保沒有漏字。英文數字字型用 `@fontsource/fredoka`
- manifest 附一般圖示與 maskable 圖示（`pnpm icons` 從同一份 SVG 產生），另附 Apple touch icon
- 進度存在 localStorage

## 影響

- 第一次載入約 730 KB，之後完全離線
- 新增中文文字時要記得跑 `pnpm fonts`，忘記的話單元測試會失敗
- iOS 加到主畫面後，網站資料不會因為一段時間沒用而被清除；只在 Safari 分頁玩，則可能被清
- 進度不跨裝置（雲端備份列在路線圖）

## 替代方案

- **Google Fonts CDN**：離線時拿不到字型
- **完整字型檔**：每個字重 15 MB，不適合預先快取
- **autoUpdate 自動更新**：可能在解題到一半時重新載入
- **IndexedDB 存檔**：資料量很小，localStorage 就足夠；之後若要做雲端同步或大量關卡紀錄再考慮
