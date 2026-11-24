# 交接檔 (handoff.md)

> 任何 Agent、任何電腦接手，**必須**先讀取本檔；收工時**必須**更新。本檔只留交接、精簡資訊，詳細脈絡寫 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
- **工程師個人工作台全面升級 (`engineer.html`、`index.html`、`gas/Code.gs`)**：
  1. 實裝工程師姓名卡片＋專屬密碼登入（預設 `1234`）與長時間保持登入，搭配管理端停用／改密自動安全登出（`tokenVersion`）。
  2. 建立四大個人分頁（`我的待辦`、`我的報價`、`歷史查詢`含全公司唯讀複查、`我的績效`），隱藏待指派放置區；新增「取消叫修」快捷鈕，並將上傳拆分為「手機相簿 / 立即拍照 / PDF 檔案」三按鈕。
  3. 照片附件下方新增獨立「維修備註 / 完修訊息」欄位（`repairNote`），雙看板、CSV 匯出與 GAS 試算表第 16 欄全線同步。
  4. 實裝單筆精準列更新（`updateSingleTicket`）防多人同時回報覆蓋與手機休眠省流／喚醒即同步；正式更新並驗證最新 GAS API 網址（`...YEhCFZ/exec`）與自動遷移舊快取。
- **公司 Inno LOGO 與企業品牌配色上線 (`logo.png`、`engineer.html`、`index.html`)**：
  - 將 Inno LOGO 去邊居中並移除兩邊外框放大呈現（登入頁 64×64、工作台與主看板 56×56、側欄 48×48），工程師登入頁採「上白底、下淺藍底」搭配黃紅藍品牌三色識別線條，並修正密碼框左側鎖頭圖示間距。
- **圖文並茂 5 頁 A4 PDF 使用手冊完成**：
  - 擷取最新實機畫面製作 [engineer_manual.html](file:///g:/我的雲端硬碟/2026%20Antigravity/叫修輔助管理系統/engineer_manual.html) 並輸出 [叫修輔助管理系統_工程師個人工作台使用手冊.pdf](file:///g:/我的雲端硬碟/2026%20Antigravity/叫修輔助管理系統/叫修輔助管理系統_工程師個人工作台使用手冊.pdf)，逐頁視覺驗證排版無誤。

## 🚦 目前狀態
- `engineer.html`、`index.html`、`logo.png` 與新版 GAS 後端皆已部署上線並通過實機瀏覽器驗證（零 Console 錯誤、API 連線正常）。
- 新產出的 PDF 手冊、`engineer_manual.html` 與本次收工更新檔待使用者確認 commit + push 至 GitHub。

## ➡️ 下一步
1. 將 `叫修輔助管理系統_工程師個人工作台使用手冊.pdf` 分發給外勤工程師同仁實際試用，蒐集第一線操作回饋。
2. 若有空可在 LINE Developers 後台將 Messaging API Webhook URL 換成最新 GAS 網址（`...YEhCFZ/exec`）；注意按下 Verify 時出現 `302 Found` 為 GAS 正常現象，直接以實際群組傳訊測試即可。
3. 依同仁實際使用回饋微調工作台或手冊內容（如補加 QR Code 或客製化密碼管理說明）。

## ⚠️ 注意事項
- 在 Google Drive 同步目錄（`g:\我的雲端硬碟\...`）下避免對同一檔案同時發起多個並行 `edit_file`，請採循序編輯避免 Windows user-mapped section 鎖定。
- LINE Developers Webhook 按 Verify 會因 GAS 302 重導向顯示 `302 Found` 提示，但實務上 LINE 正式推播訊息可正常進件，不影響使用。
- Tailwind `.input-style` 內含 `p-2.5`，若需覆寫單側內距（如左側 icon 空間）請使用 `!pl-10` 避免被 utility 蓋掉。

## 🕐 最後更新
- 更新時間：2026-11-24 23:27 (收工)
- 更新者：阿噗 @ DESKTOP-U8HAOU6
- Git push：✅ 已推 (`master`)
