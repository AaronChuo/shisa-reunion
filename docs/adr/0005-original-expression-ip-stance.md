# ADR-0005：只借用玩法，表達全部原創

- 狀態：已採用
- 日期：2026-10-15

## 背景

這款遊戲的核心玩法，啟發自家裡孩子玩的實體桌遊 Camelot Jr.（SmartGames／Smart NV，Raf Peeters 設計）：用積木搭一條路，讓兩個角色相會。正式開發並公開 repo 之前，要先釐清哪些可以用、哪些不能用。

## 決策

1. **規則與玩法可以使用**
   - 台灣著作權法第 10 條之 1：著作權「保護僅及於該著作之表達，而不及於其所表達之思想、程序、製程、系統、操作方法、概念、原理、發現」
   - 美國著作權局對遊戲的說明：遊戲的點子、名稱、玩法都不受著作權保護，只有說明文字、美術等表達受保護
2. **表達全部原創**
   - 角色是沖繩風獅爺（阿／吽），不是騎士與公主
   - 積木是紅型、赤瓦、玻璃、紅芋、竹梯、硨磲貝等造型，不用城堡塗裝
   - 文字全部自己寫
3. **不抄官方題目**：關卡全部由程式產生並以求解器驗證，不重製官方 48 關的題目卡
4. **不使用商標**：遊戲名、安裝名、商店頁、宣傳都不出現 Camelot、SmartGames；文件內只做事實性提及
5. **避免整體視覺近似**：參考美國 *Tetris Holding v. Xio Interactive*（2012）判決，即使規則可以使用，整體外觀太像原作仍可能侵權
6. **專利**：公開資料查無 Camelot Jr. 的相關專利；Smart NV 有部分實體產品的設計專利，只保護實體外觀。若要商業化，上架前委託專業人士做 FTO（侵權可能性）檢索
7. **字型**：源泉圓體（GenSen Rounded TW，v0.8 起；之前是 LXGW WenKai TC）與 Fredoka 皆為 SIL OFL 1.1，授權檔放在 `public/fonts/`

## 影響

- 公開 repo、個人與家庭使用：風險低
- 商業化前必做：FTO 專利檢索、遊戲名稱的商標檢索
- 之後新增美術時，維持「不近似原作視覺」的原則

## 替代方案

- **直接重製原作外觀與題目**：會侵害美術與題目編排的著作權，不考慮
- **向原廠申請授權**：若未來要做正式的「數位版 Camelot Jr.」才需要；目前走原創路線，不需要

## 參考

- 著作權法第 10 條之 1（全國法規資料庫）：https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=J0070017
- U.S. Copyright Office, *Games*：https://www.copyright.gov/register/tx-games.html
- *Tetris Holding, LLC v. Xio Interactive, Inc.*, 863 F. Supp. 2d 394 (D.N.J. 2012)
- SmartGames, Camelot Jr.：https://www.smartgames.eu/uk/one-player-games/camelot-jr-0

> 本 ADR 是工程端的整理，不構成法律意見。
