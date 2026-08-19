# 交接檔 (handoff.md)

> 任何 Agent、任何電腦接手，**必須**先讀取本檔；收工時**必須**更新。本檔只留交接、精簡資訊，詳細脈絡寫 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
- 補齊了 Obsidian (L3) 筆記 `專案工作流程.md` 的所有歷史決策與變動日誌。
- 將 L3 Obsidian 路徑正式登錄至 `agents.md`，確保未來開工/收工皆能自動三層級對齊。
- 完成了「PDF 檔案上傳與原生新分頁預覽」功能，全面捨棄會卡死畫面的彈出遮罩。
- 加入了明確的 Google Drive 權限觸發測試函數 `testAuth` 與 `gas/appsscript.json` 以解決授權問題。

## 🚦 目前狀態
- 系統已還原至最穩定狀態，且三層級同步 (L1 本地 / L2 GitHub / L3 Obsidian) 已 100% 完美對齊。

## ➡️ 下一步
1. **核對部署網址**：若未來想重啟 PDF 上傳功能，需確保網頁（⚙️ 設定 ➔ API 網址）填入的是最新 Apps Script 部署生成的 `https://script.google.com/macros/s/...`。
2. **檢查執行身份**：確保 Apps Script 部署設定為 **「以何者身份執行：我 (Me)」** 及 **「誰有存取權限：所有人 (Anyone)」**。

## ⚠️ 注意事項
- 遇到 `Exception: 你沒有呼叫「DriveApp.Folder.createFile」的權限` 時，表示 Google 雲端硬碟寫入被擋。解法是在 Apps Script 手動執行一次 `testAuth`，並確認部署是以「我 (Me)」的身份執行。

## 🕐 最後更新
- 更新時間：2026-08-20 00:32
- 更新者：Antigravity @ Windows
- Git push：✅ 已推 (`068d55f`)
