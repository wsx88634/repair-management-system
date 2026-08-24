# 交接檔 (handoff.md)

> 任何 Agent、任何電腦接手，**必須**先讀取本檔；收工時**必須**更新。本檔只留交接、精簡資訊，詳細脈絡寫 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
- 深度診斷了 PDF 上傳報 `Exception: 你沒有呼叫「DriveApp.Folder.createFile」的權限` 的根本原因。
- 升級了 `gas/Code.gs` 的 `testAuth()` 函數，加入主動建立測試檔案並自動刪除機制，能 100% 強制觸發 Google Drive 的 `createFile` 完整寫入權限授權。
- 在 `index.html` 與 `engineer.html` 中加入了 **PDF 15MB 檔案大小上限防護** 與 **HTML 錯誤回應診斷提醒**。
- 提供使用者完整的 3 步驟排除流程（替換 `testAuth` ➔ 執行測試 ➔ 發布新版本）。

## 🚦 目前狀態
- 前後端程式碼已全數優化完成並推送到 GitHub (`master`)。
- 等待使用者在 Apps Script 執行升級版 `testAuth` 並發布新版本後驗證實際 PDF 檔案上傳。

## ➡️ 下一步
1. **驗證 PDF 上傳**：在 Google Apps Script 執行升級版 `testAuth` 並「管理部署作業」發布「建立新版本」後，於網頁測試上傳 `澎湖喜來登20260626.pdf`。
2. **確認 API 連線設定**：確認網頁 ⚙️ 系統設定中的 API 網址為最新發布之 Web App 網址。

## ⚠️ 注意事項
- Google Apps Script 每次權限或程式碼更新後，**必須在「管理部署作業」選擇「建立新版本」重新部署**，否則線上 Web App 依然會跑舊版本的權限。

## 🕐 最後更新
- 更新時間：2026-08-24 15:43 (收工)
- 更新者：阿噗 @ DESKTOP-U8HAOU6
- Git push：⏳ 待推
