# 叫修輔助管理系統（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
叫修輔助管理系統 - 提供維修叫修、單據追蹤與輔助管理功能之自動化與智慧化管理平台。解決 Google Apps Script 在多重帳號登入下的權限混淆問題。

## 關鍵時程
- 專案初始化：2026-07-28
- 核心 UI 與 GAS 免混淆 API 建立：2026-07-28

## 目標與路線圖
- [x] 階段一：專案基礎建設與需求規劃 (L1/L2/L3 初始化完成)
- [x] 階段二：核心功能開發與介面設計 (前端 UI + Apps Script Code.gs 範本完成)
- [ ] 階段三：測試與使用者實地整合部署

## 資料夾結構
```text
叫修輔助管理系統/
├── index.html       # 叫修管理系統主 UI 頁面
├── style.css        # 現代黑藍質感設計系統與響應式樣式
├── app.js           # 前端邏輯控制器 (支援 Mock 模擬與 GAS API 直連)
├── gas/
│   ├── Code.gs      # Google Apps Script 免混淆後端程式碼
│   └── README.md    # GAS 超詳細部署指南
├── agents.md        # 專案藍圖
├── handoff.md       # 交接檔
└── .gitignore
```

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（GDrive） | `agents.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | `wsx88634/repair-management-system` | 指定時 |
| L3 | Obsidian | `叫修輔助管理系統/專案工作流程.md` | 有需要時 |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構
