# 🚀 Google Apps Script 部署教學（徹底解決權限混淆）

為了徹底消除 Google 瀏覽器「多帳號登入」導致的 `資料同步失敗 (收到 HTML)` 錯誤，請依照以下步驟部署後端。

---

## 📌 步驟 1：建立新 Apps Script 專案

1. 開啟 [Google Apps Script 官網](https://script.google.com/) 並登入您的 Google 帳號。
2. 點擊左上角的 **「新增專案」 (New Project)**。
3. 將專案名稱改為 `叫修系統 API 後端`。

---

## 📌 步驟 2：貼上程式碼

1. 刪除預設的 `function myFunction() {}`。
2. 開啟專案內的 `gas/Code.gs` 檔案，複製裡面的所有內容。
3. 貼到 Apps Script 編輯器中。
4. 按 `Ctrl + S`（或點擊上方💾儲存按鈕）。

> 💡 **進階設定（可選）**：
> 如果您想把叫修單資料寫入特定的 Google 試算表，可以在 `Code.gs` 第 8 行的 `SPREADSHEET_ID` 填入您的試算表 ID（網址中 `/d/xxxxxxxx/edit` 的部分）。若留空，系統會自動建立一張名為「叫修管理系統資料庫」的試算表。

---

## 📌 步驟 3：正確部署網頁應用程式 (關鍵!)

1. 點擊右上角藍色的 **「部署 (Deploy)」 -> 「新增部署作業 (New deployment)」**。
2. 點擊左側齒輪 ⚙️ 圖示，選擇 **「網頁應用程式 (Web app)」**。
3. 填寫部署設定（**切記依照以下選擇**）：
   - **說明 (Description)**：`v1.0 API`
   - **執行身分 (Execute as)**：選擇 **`以我的身分執行 (Me)`** 👈 *關鍵！*
   - **誰可以存取 (Who has access)**：選擇 **`任何人 (Anyone)`** 👈 *關鍵！避免多帳號登入檢查*
4. 點擊 **「部署 (Deploy)」**。
5. 第一次部署時，Google 會跳出「權限審核」視窗：
   - 點擊 **「審查權限 (Review permissions)」**。
   - 選擇您的 Google 帳號。
   - 點擊 **「Advanced (進階)」** -> 點擊 **「Go to 叫修系統 API 後端 (unsafe)」**。
   - 點擊 **「Allow (允許)」**。

---

## 📌 步驟 4：複製網址並填入前端管理介面

1. 部署成功後，畫面會顯示 **網頁應用程式網址 (Web app URL)**（格式類似：`https://script.google.com/macros/s/AKfycbx.../exec`）。
2. 複製這串網址。
3. 開啟我們的「叫修輔助管理系統」前端網頁，點擊右上角 **⚙️ 系統設定**。
4. 將網址貼入「Apps Script API 網址」欄位，點擊儲存。
5. 系統會自動測試連線並進行同步！

---

🎉 **完成！從此以後不論使用者登入幾個 Google 帳號，都能100%穩定順暢地使用叫修系統！**
