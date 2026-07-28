# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
已完全參考並升級使用者原本的「叫修資訊看板4」全量功能！
包含：工程師拖拽看板 (Kanban Drag & Drop)、待指派區、報價進度追蹤區 (未報價/已報價/同意報價)、歷史複查模糊搜尋與 SLA 統計、圖片壓縮夾帶、html2canvas 看板與分區截圖存檔、密碼驗證 CSV 報表匯出、團隊管理，並全面對接免帳號混淆的 Apps Script API。

## 🚦 目前狀態
- 前端使用 Vue 3 + Tailwind CSS + Lucide Icons，可直接用瀏覽器開啟 `index.html` 進行全功能測試體驗。
- 後端 `gas/Code.gs` 已升級支援全量欄位 (tickets + engineers)，並完美相容 Execute as: Me + Who has access: Anyone 部署。

## ➡️ 下一步
1. 使用者按 `gas/README.md` 更新/部署新的 Apps Script。
2. 於系統頁面「後端 API 設定」輸入 URL，即可徹底無縫對接真實 Google 試算表且不發生 Session HTML 混淆！

## ⚠️ 注意事項
圖片附件已內建 `compressImageToSafeSize` 壓縮防爆機制，確保存入 Google Sheet 儲存格時不超出大小上限。

## 🕐 最後更新
- 時間：2026-07-28 19:45
- 更新者：阿噗 @ DESKTOP-U8HAOU6
- Git push：✅ 已推
