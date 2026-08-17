# 交接檔 (handoff.md)

> 任何 Agent、任何電腦接手，**必須**先讀取本檔；收工時**必須**更新。本檔只留交接、精簡資訊，詳細脈絡寫 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
- 完成了「PDF 檔案上傳與原生新分頁預覽」功能，全面捨棄會卡死畫面的彈出遮罩。
- 修復了 `engineer.html` 因腳本替換造成的結構損壞與重複問題。
- 加入了明確的 Google Drive 權限觸發測試函數 `testAuth` 與 `gas/appsscript.json` 以解決授權問題。

## 🚦 目前狀態
- 系統已還原至最穩定狀態，且 PDF 安全版功能已全面上線 Vercel。
- 測試過程中，使用者因 Apps Script 的「Web App 部署網址不匹配」或「執行身份非 Me」導致上傳遭遇權限錯誤，目前使用者決議**暫時不使用此上傳功能**並先收工。

## ➡️ 下一步
1. **核對部署網址**：若未來想重啟上傳功能，需確保網頁（⚙️ 設定 ➔ API 網址）填入的是最新 Apps Script 部署生成的 `https://script.google.com/macros/s/...`。
2. **檢查執行身份**：確保 Apps Script 部署設定為 **「以何者身份執行：我 (Me)」** 及 **「誰有存取權限：所有人 (Anyone)」**。

## ⚠️ 注意事項
- 遇到 `Exception: 你沒有呼叫「DriveApp.Folder.createFile」的權限` 時，表示 Google 雲端硬碟寫入被擋。解法是在 Apps Script 手動執行一次 `testAuth`，並確認部署是以「我 (Me)」的身份執行。
- 永遠不要用 `<iframe src="data:application/pdf;base64,...">`，會被 Chrome 安全封鎖，改用 Blob URL 與原生新分頁 `window.open`。

## 🕐 最後更新
- 更新時間：2026-08-18 02:15
- 更新者：Antigravity @ Windows
- Git push：✅ 已推 (9cc5aa)
