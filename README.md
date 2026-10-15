# 小獅搭路（暫名）

幫風獅爺用積木搭一條路回到同伴身邊的益智遊戲。積木有重力、重心沒撐住就會倒，每一站的關卡都當場隨機產生。過關拿福氣幣，拿去扭蛋機收集 20 隻不同造型的風獅爺。

- **玩法**：四個難度分區（那霸港 → 讀谷村 → 美麗海 → 首里城），每趟旅程五站，中間可以選岔路
- **積木與機關**：玻璃石階、赤瓦塔、紅芋拱門、竹梯、跳跳貝、石拱橋；海膽、漲潮、石門壓板
- **PWA**：可以加到主畫面，沒有網路也能玩

線上試玩：<https://shisa-reunion.vercel.app>（iPad／iPhone 請用 Safari 打開 → 分享 → 加入主畫面）

發展計畫、架構、版權評估與路線圖：[docs/README.md](docs/README.md)

## 開發

需要 Node 22 與 pnpm 10。

```sh
pnpm install
pnpm dev          # 開發伺服器
pnpm test         # 單元測試（規則引擎、關卡產生、扭蛋、字型涵蓋）
pnpm e2e          # 端對端測試（會先 build，使用本機的 Google Chrome）
pnpm lint         # Biome
pnpm typecheck
pnpm build        # 產出 dist/（含 service worker）
```

新增中文文字之後，執行 `pnpm fonts` 重建子集字型；漏跑的話單元測試會失敗。圖示改動後執行 `pnpm icons`。

## 版本

採用語意化版本，變更記錄在 [CHANGELOG.md](CHANGELOG.md)，每個版本打 `vX.Y.Z` tag。

## 致謝

- 玩法靈感來自 SmartGames 的實體桌遊 Camelot Jr.（Raf Peeters 設計）。本作的美術、角色、關卡與文字皆為原創，與 SmartGames 無關
- 字型：[LXGW WenKai TC](https://github.com/lxgw/LxgwWenkaiTC)、[Fredoka](https://fonts.google.com/specimen/Fredoka)，皆為 SIL Open Font License 1.1，授權檔見 `public/fonts/`
