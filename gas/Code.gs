/**
 * 叫修輔助管理系統 - Apps Script 後端 API
 * 部署設定提醒：
 * 1. 執行身分 (Execute as)：以我的身分執行 (Me)
 * 2. 誰可以存取 (Who has access)：任何人 (Anyone)
 */

// 可在此指定現有的 Google 試算表 ID（若留空，系統會自動在雲端硬碟建立一張名為「叫修管理系統資料庫」的試算表）
const SPREADSHEET_ID = "";
const SHEET_NAME = "叫修單據紀錄";

/**
 * 取得或建立資料庫試算表
 */
function getDbSheet() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    // 尋找或自動建立預設試算表
    const files = DriveApp.getFilesByName("叫修管理系統資料庫");
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create("叫修管理系統資料庫");
    }
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 初始化標頭欄位
    const headers = [
      "單號 (ID)",
      "報修時間",
      "報修人",
      "聯絡電話",
      "所屬部門/地點",
      "設備類別",
      "設備名稱/編號",
      "問題描述",
      "緊急程度",
      "處理狀態",
      "維修人員備註",
      "最後更新時間"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * GET 請求處理器：讀取所有單據或測試 API 狀態
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "list";

    if (action === "ping") {
      return respondJSON({ status: "success", message: "叫修系統 API 運作正常 (Execute as Me)" });
    }

    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return respondJSON({ status: "success", data: [] });
    }

    const headers = data[0];
    const rows = data.slice(1);

    const tickets = rows.map((row, index) => {
      return {
        rowIndex: index + 2, // 1-indexed header is 1
        id: row[0] ? String(row[0]) : "",
        createdAt: row[1] ? formatDate(row[1]) : "",
        reporter: row[2] || "",
        phone: row[3] || "",
        location: row[4] || "",
        category: row[5] || "",
        device: row[6] || "",
        description: row[7] || "",
        priority: row[8] || "中",
        status: row[9] || "待處理",
        note: row[10] || "",
        updatedAt: row[11] ? formatDate(row[11]) : ""
      };
    });

    return respondJSON({ status: "success", data: tickets });
  } catch (err) {
    return respondJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * POST 請求處理器：新增叫修單或更新單據狀態
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (ex) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || "create";
    const sheet = getDbSheet();

    if (action === "create") {
      const id = "REP-" + new Date().getTime().toString().slice(-6) + Math.floor(Math.random() * 100);
      const nowStr = formatDate(new Date());

      const newRow = [
        id,
        nowStr,
        body.reporter || "匿名",
        body.phone || "",
        body.location || "",
        body.category || "其他",
        body.device || "",
        body.description || "",
        body.priority || "中",
        "待處理", // 初始狀態
        body.note || "",
        nowStr
      ];

      sheet.appendRow(newRow);
      return respondJSON({
        status: "success",
        message: "叫修單新增成功",
        ticket: {
          id: id,
          createdAt: nowStr,
          reporter: body.reporter,
          phone: body.phone,
          location: body.location,
          category: body.category,
          device: body.device,
          description: body.description,
          priority: body.priority,
          status: "待處理",
          note: body.note || "",
          updatedAt: nowStr
        }
      });
    }

    if (action === "update") {
      const ticketId = body.id;
      if (!ticketId) {
        return respondJSON({ status: "error", message: "缺少單號 (id)" });
      }

      const data = sheet.getDataRange().getValues();
      let targetRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(ticketId)) {
          targetRowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (targetRowIndex === -1) {
        return respondJSON({ status: "error", message: "找不到指定的單號：" + ticketId });
      }

      const nowStr = formatDate(new Date());
      if (body.status) sheet.getRange(targetRowIndex, 10).setValue(body.status);
      if (body.note !== undefined) sheet.getRange(targetRowIndex, 11).setValue(body.note);
      sheet.getRange(targetRowIndex, 12).setValue(nowStr);

      return respondJSON({
        status: "success",
        message: "單據狀態更新成功",
        id: ticketId,
        status: body.status,
        updatedAt: nowStr
      });
    }

    return respondJSON({ status: "error", message: "未知的 action 指令" });
  } catch (err) {
    return respondJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 通用 JSON 回傳函式 (避免 HTML 重定向與 Session 混淆)
 */
function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 時間格式化
 */
function formatDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+8", "yyyy-MM-dd HH:mm:ss");
}
