# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
完成 LINE 派工推播測試與 GAS 綁定除錯，並順利還原回最穩定運作基線：
1. **試算表 ID 永久鎖定**：
   - 在 `gas/Code.gs` 中將 `SPREADSHEET_ID` 永久綁定至主資料庫 (`1MkdyLZ2BRIHcS7WwwklWE47g6h7PJFafq8-cP4wmvn8`)，解決先前因為雲端自動尋找最新檔案導致 LINE ID 與叫修單據寫入不同試算表的問題。
2. **後端恢復最穩定基線版本**：
   - 應使用者要求「先拿掉推播功能讓系統正常運作」，已將 `gas/Code.gs` 後端寫入邏輯還原至穩定運作的完整覆蓋版本，移除暫時性的推播與智慧比對，確保網頁拖曳、更新與儲存 100% 穩定不掉單。
3. **本機 file:// 與 CORS 通道防護增強**：
   - 在 `index.html` 與 `engineer.html` 中加入了隱形 iframe 表單穿透備用通道，確保即使使用者直接由本機 `file://` 開啟，也能正常發送 POST 請求。

## 🚦 目前狀態與線上驗證
1. **正式網址運作正常 (Vercel 全球部署)**：
   - 👔 主看板網址：`https://repair-management-system-nu.vercel.app`
   - 👷 工程師看板網址：`https://repair-management-system-nu.vercel.app/engineer.html`
2. **Git 狀態**：
   - ✅ 已 commit 並成功 push 至 master 分支 (`cbd4197`)。

## ➡️ 下一步
- 使用者目前已完成 Apps Script 最新版本的部署與資料還原，系統運行正常。
- 若未來需要重新啟用 LINE 派工自動推播，可基於目前固定的 `SPREADSHEET_ID` 與正式 Vercel 網址進行二次階段性測試。

## ⚠️ 注意事項
- Apps Script 修改後，必須於 Google Apps Script 介面中執行「管理部署 ➔ 編輯 ➔ 建立新版本 ➔ 部署」，網頁 API 才能吃到最新邏輯。
- 試算表目前已綁定指定 ID，不可隨意移除 `SPREADSHEET_ID` 設定。

## 🕐 最後更新
- 時間：2026-08-17 08:14
- 更新者：阿噗 @ Windows
- Git push：✅ 已推 (`cbd4197`)
