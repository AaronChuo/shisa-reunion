# 小獅搭路（暫名）

幫西薩用積木搭一條路回到同伴身邊的益智遊戲。積木有重力、重心沒撐住就會倒，每一站的關卡都當場隨機產生。過關拿福氣幣，拿去扭蛋機收集 50 隻不同造型的西薩，每一隻都附一段可以念給孩子聽的沖繩小故事。

- **玩法**：七個難度分區（那霸港 → 讀谷村 → 美麗海 → 古宇利島 → 竹富島 → 西表島 → 首里城），每趟旅程五站，中間可以選岔路
- **積木與機關**：玻璃石階、赤瓦塔、紅芋拱門、竹梯、跳跳貝、石拱橋、溜滑梯、藤蔓；海膽、漲潮、石門壓板、星砂
- **開場故事**：第一次打開時，用一本會動、會說話的小繪本認識主角西薩（シーサー，沖繩話的「獅子」）
- **扭蛋**：傳統、海洋、美食、祭典、動物、工藝六個系列，圖鑑裡可以按「念給我聽」用裝置的語音朗讀故事
- **三線音樂**：程式即時合成的三線，依場景播放沖繩傳統民謠；音效也用三線、太鼓、三板
- **用手玩扭蛋機**：拖福氣幣進投幣口、手指轉把手，玻璃罩裡的扭蛋會滾、會撞
- **不識字也會玩**：每個畫面一顆會呼吸的主要按鈕，配圖示；第一關有手指示範怎麼拖積木
- **PWA**：可以加到主畫面，沒有網路也能玩

線上試玩：<https://shisa-reunion.vercel.app>（iPad／iPhone 請用 Safari 打開 → 分享 → 加入主畫面）

發展計畫、架構、版權評估與路線圖：[docs/README.md](docs/README.md)

## 開發

需要 Node 22 與 pnpm 10。

```sh
pnpm install
pnpm dev          # 開發伺服器
pnpm test         # 單元測試（規則引擎、關卡產生、扭蛋與故事、存檔升級、字型涵蓋）
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
- 字型：[源泉圓體 GenSen Rounded](https://github.com/ButTaiwan/gensen-font)、[Fredoka](https://fonts.google.com/specimen/Fredoka)，皆為 SIL Open Font License 1.1，授權檔見 `public/fonts/`
