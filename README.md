# 西薩搭搭路

幫西薩用積木搭一條路回到同伴身邊的益智遊戲。積木有重力、重心沒撐住就會倒，每一站的關卡都當場隨機產生。過關拿福氣幣，拿去扭蛋機收集 60 隻不同造型的西薩，每一隻都附一段可以念給孩子聽的沖繩小故事。

- **玩法**：十個分區分五個等級（入門那霸市 → 初級讀谷村 → 進階美麗海、古宇利島、中城城跡 → 高手竹富島、西表島、宮古島 → 大師首里城、久米島），每趟旅程五站；每區只帶一個新積木或機關，之後的站從學過的裡面隨機抽；岔路時選一條風景路（白天、黃昏或夜晚的真實地名）
- **積木與機關**：琉璃階梯、赤瓦塔、紅芋拱門、竹梯、跳跳貝、石拱橋、藤蔓、溜滑梯；海膽、星砂、石門、漲潮
- **地方明信片**：沖繩和每個地區都有一張插畫明信片，介紹當地的風景、文化和典故，去過就收進圖鑑
- **開場故事**：第一次打開時，用一本會動、會說話的小繪本認識主角西薩（シーサー，沖繩話的「獅子」）
- **扭蛋**：傳統、海洋、美食、祭典、動物、工藝、離島七個系列，圖鑑裡可以按「念給我聽」用裝置的語音朗讀故事
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
pnpm test         # 單元測試（規則引擎、關卡產生、扭蛋與故事、存檔升級、字型涵蓋），約 2 秒
pnpm test:gen     # 生成全掃描（每個分區所有元素組合都生成一遍，依核心數平行跑）與新舊求解器對照
pnpm test:all     # 以上兩者
pnpm bench:gen    # 比較兩種生成方法的速度與關卡特徵，改生成器時要跑
pnpm bench:solver # 比較新舊求解器的速度
pnpm e2e          # 端對端測試（會先 build，使用本機的 Google Chrome）
pnpm lint         # Biome
pnpm typecheck
pnpm build        # 產出 dist/（含 service worker）
```

新增中文文字之後，執行 `pnpm fonts` 重建子集字型；漏跑的話單元測試會失敗。圖示改動後執行 `pnpm icons`。

## 版本

採用語意化版本，變更記錄在 [CHANGELOG.md](CHANGELOG.md)，每個版本打 `vX.Y.Z` tag。

## 授權

本作保留所有權利（見 [LICENSE](LICENSE)），repo 公開只供查看。照片、字型等第三方素材依各自的授權，列在下方。

## 致謝

- 玩法靈感來自 SmartGames 的實體桌遊 Camelot Jr.（Raf Peeters 設計）。本作的美術、角色、關卡與文字皆為原創，與 SmartGames 無關
- 明信片照片（皆來自 Wikimedia Commons，公眾領域或 CC BY）：
  - 沖繩：[2013-07-23 Shisa on roof at Taketomijima.jpg](https://commons.wikimedia.org/wiki/File:2013-07-23_Shisa_on_roof_at_Taketomijima.jpg)，ajari，[CC BY 2.0](https://creativecommons.org/licenses/by/2.0)，經裁切縮小
  - 那霸市：[Kokusai-dori09n4260.jpg](https://commons.wikimedia.org/wiki/File:Kokusai-dori09n4260.jpg)，663highland，[CC BY 2.5](https://creativecommons.org/licenses/by/2.5)，經裁切縮小
  - 讀谷村：[An awesome sunset at Cape Zanpa.jpg](https://commons.wikimedia.org/wiki/File:An_awesome_sunset_at_Cape_Zanpa.jpg)，Daniel Ramirez，[CC BY 2.0](https://creativecommons.org/licenses/by/2.0)，經裁切縮小
  - 美麗海：[Churaumi Aquarium main tank 'Kuroshio Sea'.jpg](https://commons.wikimedia.org/wiki/File:Churaumi_Aquarium_main_tank_%27Kuroshio_Sea%27.jpg)，Megapixie，Public domain，經裁切縮小
  - 古宇利島：[Kouri Bridge (15130568259).jpg](https://commons.wikimedia.org/wiki/File:Kouri_Bridge_(15130568259).jpg)，Takuya ASADA，[CC BY 2.0](https://creativecommons.org/licenses/by/2.0)，經裁切縮小
  - 中城城跡：[Nakagusuku Castle28n3104.jpg](https://commons.wikimedia.org/wiki/File:Nakagusuku_Castle28n3104.jpg)，663highland，[CC BY 2.5](https://creativecommons.org/licenses/by/2.5)，經裁切縮小
  - 竹富島：[Taketomi Island Yado.jpg](https://commons.wikimedia.org/wiki/File:Taketomi_Island_Yado.jpg)，Kzaral，[CC BY 2.0](https://creativecommons.org/licenses/by/2.0)，經裁切縮小
  - 西表島：[Nakama River Iriomote Okinawa Japan04s3.jpg](https://commons.wikimedia.org/wiki/File:Nakama_River_Iriomote_Okinawa_Japan04s3.jpg)，663highland，[CC BY 2.5](https://creativecommons.org/licenses/by/2.5)，經裁切縮小
  - 宮古島：[Miyako's Irabu Bridge (52204268416).jpg](https://commons.wikimedia.org/wiki/File:Miyako%27s_Irabu_Bridge_(52204268416).jpg)，Raita Futo from Tokyo, Japan，[CC BY 2.0](https://creativecommons.org/licenses/by/2.0)，經裁切縮小
  - 首里城：[Shurei-mon.jpeg](https://commons.wikimedia.org/wiki/File:Shurei-mon.jpeg)，nnh，Public domain，經裁切縮小
  - 久米島：[Okinawa-kumejima Hatenohama Beach-xl.jpg](https://commons.wikimedia.org/wiki/File:Okinawa-kumejima_Hatenohama_Beach-xl.jpg)，Kumejima93_OKINAWA，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0)，經裁切縮小
- 配樂：九首沖繩傳統曲的旋律都已是公共財，只取旋律、由程式即時合成，不用歌詞、編曲或錄音
  - 〈てぃんさぐぬ花〉〈赤田首里殿內〉〈谷茶前〉〈唐船ドーイ〉〈花ぬ風車〉〈安里屋ユンタ〉（旋律為宮良長包 1934 年改編版，他 1939 年過世）〈デンサー節〉（相傳為宮良里賢 1768 年所作）〈豊年の歌〉：旋律讀自 [mu-tech.org](https://www.mu-tech.org/) 免費 MIDI 的主旋律聲部
  - 〈久米阿嘉節〉：大城彦五郎編《琉球楽典 工工四》（1925），[琉球大學附屬圖書館數位典藏](https://shimuchi.lib.u-ryukyu.ac.jp/collection/sakamaki/hw5823102)（原件為夏威夷大學阪巻・宝玲文庫）；與明治期手抄本《工工四》（東京藝術大學附屬圖書館藏）逐格比對
  - 〈島風〉〈搭路小調〉〈石拱門〉是原創曲
- 字型：[源泉圓體 GenSen Rounded](https://github.com/ButTaiwan/gensen-font)、[Fredoka](https://fonts.google.com/specimen/Fredoka)，皆為 SIL Open Font License 1.1，授權檔見 `public/fonts/`
