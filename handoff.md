# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
完成 LINE Bot 自動叫修說明與後端邏輯、行事曆狀態篩選及日期總覽 Modal 實裝：
1. **LINE Bot 自動進件機制**：
   - 於 `gas/Code.gs` 實裝 `doPost(e)` 處理 LINE Webhook 訊息。支援 LINE 群組輸入 `報修888` 暗號 + 模板自動解析寫入試算表並推播至前端。
   - 向使用者釐清 LINE Bot 免費回覆機制與次數限制疑慮（被動回覆全免費，每天支援最多 2萬次 GAS 請求）。
2. **派工行事曆「未執行 / 完修」動態篩選按鈕**：
   - 於 `index.html` 與 `engineer.html` 行事曆頂部新增狀態快速切換按鈕（支援切換顯示未完修單據、完修單據或全部顯示）。
3. **日期格子點擊跳出「當日派單總覽視窗 (Day Modal)」**：
   - 點擊日曆任何一天的空白區域，會跳出當日派單清單 Modal，顯示該日所有派單細節，並可直接點擊單據開啟編輯。
4. **編碼修復與 Vercel 線上發布**：
   - 徹底修復 HTML 檔案標頭 UTF-8 編碼波動問題，並成功 Git force push 至 GitHub 與 Vercel 部署。

## 🚦 目前狀態與線上驗證
1. **正式網址運作正常 (Vercel 全球部署)**：
   - 👔 主看板網址：`https://repair-management-system-nu.vercel.app`
   - 👷 工程師看板網址：`https://repair-management-system-nu.vercel.app/engineer.html`
2. **Git 狀態**：
   - ✅ 已 commit 並成功 push 至 master 分支 (`138d16f`)。

## ➡️ 下一步
- 觀察團隊實地使用「行事曆切換按鈕」與「日期點擊總覽 Modal」的反饋與流暢度。
- 若需要，可進一步完成 LINE Bot 實體憑證 (Channel Access Token) 設定與線上測試。

## ⚠️ 注意事項
- 修改 HTML / JS 檔案時務必使用 UTF-8 無 BOM 編碼，避免在 Windows 環境下使用命令列替代字串時引發 HTML 標籤亂碼。

## 🕐 最後更新
- 時間：2026-08-15 22:10
- 更新者：阿噗 @ Windows
- Git push：✅ 已推 (138d16f)
