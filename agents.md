# 叫修輔助管理系統（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
叫修輔助管理系統 - 提供維修叫修、單據追蹤與輔助管理功能之自動化與智慧化管理平台。解決 Google Apps Script 在多重帳號登入下的權限混淆問題。

## 關鍵時程
- 專案初始化：2026-07-28
- 核心 UI 與 GAS 免混淆 API 建立：2026-07-28
- 434 筆歷史資料匯入、密碼防護與雙 PDF 報告導出：2026-07-29
- 快捷通話/導航卡片整合與 Vercel 手機網址發布：2026-07-29
- Google Drive 雲端照片儲存、最多 5 張批次上傳與進度回饋整合：2026-07-30
- 圖片全螢幕燈箱 (手機滑動/鍵盤箭頭/縮圖切換)、試算表 ID 鎖定防溯回與 PDF 操作手冊更新：2026-07-31
- 單筆維修照片上傳數量上限提升至 10 張，同步更新全線 UI 與 PDF 手冊：2026-08-01
- 新增必填「問題狀況」獨立欄位與第一行自動複製連動、CSV 匯出全空白徹底修復、截圖 3 倍高畫質升級與獨立 PDF 版說明日誌發布：2026-08-04
- 行事曆 (Calendar View) 檢視功能實裝、GAS 資料庫自動抓取機制與歷史資料顯示修復：2026-08-13
- LINE Bot 自動進件 Webhook 解構、行事曆「未執行/完修」狀態篩選與日期點擊總覽 Modal 實裝：2026-08-15
- 試算表 SPREADSHEET_ID 永久鎖定與後端安定性回滾修復：2026-08-17
- PDF 上傳 createFile 權限觸發升級、15MB 限制防護與 HTML 錯誤診斷優化：2026-08-24
- 公司辦公室專用 Google Drive 照片與報價單 NAS 自動同步歸檔工具包實裝與驗證：2026-08-26
- 看板截圖中文字型裁切修復、叫修單據活動歷程時間軸（案件時間節點紀錄區）全自動日誌追蹤與客戶名稱標籤實裝：2026-09-03

## Obsidian 筆記路徑 (L3 同步)
- g:/我的雲端硬碟/secondbrain/叫修輔助管理系統/專案工作流程.md

## 目標與路線圖
- [x] 階段一：專案基礎建設與需求規劃 (L1/L2/L3 初始化完成)
- [x] 階段二：核心功能開發與介面設計 (前端 UI + 434 筆叫修單據 + Apps Script Code.gs 範本完成)
- [x] 階段三：測試與實地整合部署 (主看板 + 工程師看板 + Vercel 全球手機網址部署 + 雙 PDF 簡報完工)

## 資料夾結構
```text
叫修輔助管理系統/
├── index.html       # 叫修管理系統主 UI 頁面 (總管/調度員版)
├── engineer.html    # 叫修輔助管理系統 - 工程師專用看板 (權限限制與圖檔壓縮)
├── boss_report.html # 老闆簡報 HTML 來源
├── user_manual.html # 團隊操作手冊 HTML 來源
├── release_notes.html # 版本更新說明 HTML 來源
├── 叫修輔助管理系統_功能更新說明與版本日誌.pdf # 獨立 PDF 更新日誌
├── imported_data.json # 歷史轉檔 JSON (434 筆叫修單據 + 9 位工程師)
├── gas/
│   ├── Code.gs      # Google Apps Script 免混淆後端程式碼
│   └── README.md    # GAS 超詳細部署指南
├── agents.md        # 專案藍圖
├── handoff.md       # 交接檔
└── .gitignore
```

## 手機上線正式網址 (Vercel 託管)
- 👔 **主看板**：`https://repair-management-system-nu.vercel.app`
- 👷 **工程師看板**：`https://repair-management-system-nu.vercel.app/engineer.html`

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構
