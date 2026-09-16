# 交接檔 (handoff.md)

> 任何 Agent、任何電腦接手，**必須**先讀取本檔；收工時**必須**更新。本檔只留交接、精簡資訊，詳細脈絡寫 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
- **頂部工具列精簡**：移除冗餘的「同步寫入雲端」按鈕，統一由看板背景自動同步機制處理（亦保留在 API 設定視窗底部備用）。
- **重複殘影卡片（Ghost Cards）防護**：重構 `mergeTickets` 與 `deduplicateTickets` 去重防護，以 ID 為唯一 Map 鍵，合併時嚴格去重並配合本地操作鎖，杜絕拖曳時產生同名卡片與連帶誤刪問題。
- **GAS 連線心跳保溫機制**：加入 3 分鐘自動發送輕量 `ping` 心跳請求，減少 Google Apps Script 免費版冷啟動等待時間。
- **語法錯誤排查與徹底修復**：修正 `index.html` 與 `engineer.html` 內的閉合括號與 `window.onerror` / `errorHandler` 跳脫字元錯誤，全線通過 Node.js 語法檢驗。

## 🚦 目前狀態
- 前端程式碼（`index.html`、`engineer.html`、`app.js`）全數通過語法校驗並成功推送至 GitHub `master`。
- Vercel 線上站點已完成即時自動部署。

## ➡️ 下一步
1. 請使用者使用 `Ctrl + F5`（或清除快取重新整理）載入最新版本頁面驗證。
2. 進行看板拖曳、編輯單據與 GAS 載入測試。

## ⚠️ 注意事項
- 瀏覽器端如有舊快取，務必強制重新整理 `Ctrl + F5`。

## 🕐 最後更新
- 更新時間：2026-09-17 01:15
- 更新者：阿噗 @ Windows
- Git push：✅ 已推 (`master`)
