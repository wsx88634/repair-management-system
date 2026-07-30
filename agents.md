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
