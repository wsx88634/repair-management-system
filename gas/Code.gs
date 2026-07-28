/**
 * 叫修輔助管理系統 - 全功能 Apps Script 後端 API (免帳號混淆版)
 * 部署設定提醒：
 * 1. 執行身分 (Execute as)：以我的身分執行 (Me)
 * 2. 誰可以存取 (Who has access)：任何人 (Anyone)
 */

const SPREADSHEET_ID = ""; // 若留空，系統會自動在雲端硬碟建立「叫修管理系統資料庫」
const TICKET_SHEET_NAME = "叫修單據紀錄";
const SYSTEM_SHEET_NAME = "系統設定與團隊";

// 預設工程師團隊名單
const DEFAULT_ENGINEERS = ["小張", "老王", "阿豪", "陳技師"];

/**
 * 取得或建立主資料表
 */
function getDbSheets() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    const files = DriveApp.getFilesByName("叫修管理系統資料庫");
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create("叫修管理系統資料庫");
    }
  }

  // 1. 單據工作表
  let ticketSheet = ss.getSheetByName(TICKET_SHEET_NAME);
  if (!ticketSheet) {
    ticketSheet = ss.insertSheet(TICKET_SHEET_NAME);
    const headers = [
      "單號 (id)",
      "報修日期 (reportTime)",
      "客戶名稱 (customer)",
      "設備機型 (model)",
      "負責工程師 (engineer)",
      "時效天數 (slaDays)",
      "當前狀態 (status)",
      "完成日期 (completedDate)",
      "報價進度 (quoteState)",
      "是否封存 (isArchived)",
      "詳細備註與資訊 (details)",
      "附件圖片 (attachments JSON)",
      "最後更新時間"
    ];
    ticketSheet.appendRow(headers);
    ticketSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    ticketSheet.setFrozenRows(1);
  }

  // 2. 系統與團隊工作表
  let sysSheet = ss.getSheetByName(SYSTEM_SHEET_NAME);
  if (!sysSheet) {
    sysSheet = ss.insertSheet(SYSTEM_SHEET_NAME);
    sysSheet.appendRow(["設定項目", "內容 (JSON / Text)"]);
    sysSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sysSheet.setFrozenRows(1);
    sysSheet.appendRow(["engineers", JSON.stringify(DEFAULT_ENGINEERS)]);
  }

  return { ss, ticketSheet, sysSheet };
}

/**
 * GET 請求處理器
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "getData";

    if (action === "ping") {
      return respondJSON({ status: "success", message: "叫修系統 API 運作正常 (Execute as Me 免混淆)" });
    }

    const { ticketSheet, sysSheet } = getDbSheets();

    // 讀取工程師名單
    let engineers = [...DEFAULT_ENGINEERS];
    const sysData = sysSheet.getDataRange().getValues();
    for (let i = 1; i < sysData.length; i++) {
      if (sysData[i][0] === "engineers" && sysData[i][1]) {
        try { engineers = JSON.parse(sysData[i][1]); } catch(ex) {}
      }
    }

    // 讀取單據
    const tData = ticketSheet.getDataRange().getValues();
    const tickets = [];

    if (tData.length > 1) {
      for (let i = 1; i < tData.length; i++) {
        const row = tData[i];
        if (!row[0]) continue; // 跳過空單號

        let attachments = [];
        if (row[11]) {
          try {
            attachments = typeof row[11] === 'string' && row[11].startsWith('[') ? JSON.parse(row[11]) : [row[11]];
          } catch(ex) {
            if (typeof row[11] === 'string' && row[11].startsWith('data:image')) attachments = [row[11]];
          }
        }

        tickets.push({
          id: String(row[0]),
          reportTime: row[1] ? formatDateOnly(row[1]) : "",
          customer: String(row[2] || ""),
          model: String(row[3] || ""),
          engineer: String(row[4] || "未指派"),
          slaDays: Number(row[5]) || 3,
          status: String(row[6] || "未執行"),
          completedDate: row[7] ? formatDateOnly(row[7]) : "",
          quoteState: String(row[8] || ""),
          isArchived: Boolean(row[9] === true || row[9] === "TRUE" || row[9] === "true"),
          details: String(row[10] || ""),
          attachments: attachments
        });
      }
    }

    return respondJSON({
      status: "success",
      tickets: tickets,
      engineers: engineers
    });
  } catch (err) {
    return respondJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * POST 請求處理器：批量同步 tickets 與 engineers
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (ex) {
        body = {};
      }
    }

    const { ticketSheet, sysSheet } = getDbSheets();

    // 1. 更新工程師團隊
    if (body.engineers && Array.isArray(body.engineers)) {
      const sysData = sysSheet.getDataRange().getValues();
      let engRowIndex = -1;
      for (let i = 1; i < sysData.length; i++) {
        if (sysData[i][0] === "engineers") {
          engRowIndex = i + 1;
          break;
        }
      }
      const jsonStr = JSON.stringify(body.engineers);
      if (engRowIndex > 0) {
        sysSheet.getRange(engRowIndex, 2).setValue(jsonStr);
      } else {
        sysSheet.appendRow(["engineers", jsonStr]);
      }
    }

    // 2. 更新單據資料 (全量覆寫或同步更新)
    if (body.tickets && Array.isArray(body.tickets)) {
      // 保留表頭，清除舊數據
      const lastRow = ticketSheet.getLastRow();
      if (lastRow > 1) {
        ticketSheet.getRange(2, 1, lastRow - 1, 13).clearContent();
      }

      const rowsToAppend = body.tickets.map(t => [
        t.id,
        t.reportTime || "",
        t.customer || "",
        t.model || "",
        t.engineer || "未指派",
        t.slaDays || 3,
        t.status || "未執行",
        t.completedDate || "",
        t.quoteState || "",
        t.isArchived ? true : false,
        t.details || "",
        JSON.stringify(t.attachments || []),
        formatDate(new Date())
      ]);

      if (rowsToAppend.length > 0) {
        ticketSheet.getRange(2, 1, rowsToAppend.length, 13).setValues(rowsToAppend);
      }
    }

    return respondJSON({ status: "success", message: "資料同步儲存成功" });
  } catch (err) {
    return respondJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(d) {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return Utilities.formatDate(dateObj, "GMT+8", "yyyy-MM-dd HH:mm:ss");
}

function formatDateOnly(d) {
  if (!d) return "";
  if (typeof d === "string" && !d.includes("T")) return d.split(" ")[0];
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d).split("T")[0];
  return Utilities.formatDate(dateObj, "GMT+8", "yyyy-MM-dd");
}
