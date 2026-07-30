/**
 * 叫修輔助管理系統 - 全功能 Apps Script 後端 API (免帳號混淆與防溯回增強版)
 * 部署設定提醒：
 * 1. 執行身分 (Execute as)：以我的身分執行 (Me)
 * 2. 誰可以存取 (Who has access)：任何人 (Anyone)
 */

const SPREADSHEET_ID = "1MkdyLZ2BRIHcS7WwwklWE47g6h7PJFafq8-cP4wmvn8"; // 已精準鎖定正確的「叫修管理系統資料庫」
const TICKET_SHEET_NAME = "叫修單據紀錄";
const SYSTEM_SHEET_NAME = "系統設定與團隊";

// 預設真實工程師團隊名單 (9 位團隊成員)
const DEFAULT_ENGINEERS = ["廖聖典 Max", "劉峻宇 Otto", "陳柏凱 Kevin", "林正賢 Jeff", "陳祐嘉 Dean", "邱信豪 Mars", "楊棟嘉 Ken", "劉明忠 Yuie", "葉幸忠 Sc.yeh"];

/**
 * 取得或建立主資料表 (自動找尋最新更新的叫修資料庫，防止讀取到舊同名表格)
 */
function getDbSheets() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    const files = DriveApp.getFilesByName("叫修管理系統資料庫");
    let latestFile = null;
    let latestTime = 0;
    while (files.hasNext()) {
      const file = files.next();
      const updated = file.getLastUpdated().getTime();
      if (updated > latestTime) {
        latestTime = updated;
        latestFile = file;
      }
    }
    if (latestFile) {
      ss = SpreadsheetApp.open(latestFile);
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

    // 讀取工程師名單 (若系統檔為舊假名單，自動矯正為 9 位團隊成員)
    let engineers = [...DEFAULT_ENGINEERS];
    const sysData = sysSheet.getDataRange().getValues();
    let sysEngRowIndex = -1;
    for (let i = 1; i < sysData.length; i++) {
      if (sysData[i][0] === "engineers") {
        sysEngRowIndex = i + 1;
        if (sysData[i][1]) {
          try {
            const parsed = JSON.parse(sysData[i][1]);
            if (Array.isArray(parsed) && parsed.length >= 8) {
              engineers = parsed;
            }
          } catch(ex) {}
        }
        break;
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

    if (body.action === "uploadImage" && body.image) {
      const res = saveImageToDrive(body.image, body.fileName);
      return respondJSON(res);
    }

    const { ticketSheet, sysSheet } = getDbSheets();

    // 1. 更新工程師團隊
    if (body.engineers && Array.isArray(body.engineers) && body.engineers.length > 0) {
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

    // 2. 更新單據資料 (僅在有有效單據陣列時寫入，防護空陣列全清)
    if (body.tickets && Array.isArray(body.tickets) && body.tickets.length > 0) {
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
  const str = String(d).trim();
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return str.split("T")[0].split(" ")[0];
  return Utilities.formatDate(dateObj, "GMT+8", "yyyy-MM-dd");
}

const FOLDER_NAME = "叫修系統照片附件";

function getOrCreateDriveFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    const folder = DriveApp.createFolder(FOLDER_NAME);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

function saveImageToDrive(base64Data, fileName) {
  try {
    const folder = getOrCreateDriveFolder();
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.substring(base64Data.indexOf(',') + 1));
    const blob = Utilities.newBlob(bytes, contentType, fileName || ("repair_img_" + new Date().getTime() + ".jpg"));
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    // Return direct image preview URL from Google Drive CDN
    const url = "https://lh3.googleusercontent.com/d/" + fileId;
    return { status: "success", url: url, fileId: fileId };
  } catch(err) {
    return { status: "error", message: err.toString() };
  }
}
