/**
 * 叫修輔助管理系統 - 全功能 Apps Script 後端 API (免帳號混淆與防溯回增強版)
 * 部署設定提醒：
 * 1. 執行身分 (Execute as)：以我的身分執行 (Me)
 * 2. 誰可以存取 (Who has access)：任何人 (Anyone)
 */

const SPREADSHEET_ID = "1MkdyLZ2BRIHcS7WwwklWE47g6h7PJFafq8-cP4wmvn8"; // 若指定試算表ID可精準鎖定；若留空自動選取雲端最新建立的「叫修管理系統資料庫」
const TICKET_SHEET_NAME = "叫修單據紀錄";
const SYSTEM_SHEET_NAME = "系統設定與團隊";

// LINE Bot 自動報修設定
const LINE_PASSCODE = "888"; // 留空代表不需要輸入暗號，在群組發送包含叫修/報修等關鍵字或格式即自動進件 // 通關密語 (包含此暗號且開頭為 報修/叫修/派工 才會自動進件)
const LINE_CHANNEL_ACCESS_TOKEN = "3MCMc4/f/yB96MxkBtKm5E49QTR3ybLSt0VP+WkUaLWkHziBuUbybaYg9vIK7Ab2/5o5ENV4D8EFUmThyG6TylE5g31yH0tVxUlU40KZOPP32OxjljOVKktKxk6PT4Br3AEMcVkXu6RX209/5zwRSQdB04t89/1O/w1cDnyilFU=";

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
      "最後更新時間",
      "問題狀況 (issue)"
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

        let logs = [];
        if (row[14]) {
          try {
            logs = typeof row[14] === 'string' && row[14].startsWith('[') ? JSON.parse(row[14]) : [];
          } catch(ex) {
            logs = [];
          }
        }

        const detailsStr = String(row[10] || "");
        const firstLineIssue = detailsStr.trim() ? detailsStr.trim().split('\n')[0].trim() : "";

        tickets.push({
          id: String(row[0]),
          reportTime: row[1] ? formatDateOnly(row[1]) : "",
          customer: String(row[2] || ""),
          model: String(row[3] || ""),
          issue: (row[13] !== undefined && String(row[13]).trim() !== "") ? String(row[13]) : firstLineIssue,
          engineer: String(row[4] || "未指派"),
          slaDays: Number(row[5]) || 3,
          status: String(row[6] || "未執行"),
          completedDate: row[7] ? formatDateOnly(row[7]) : "",
          quoteState: String(row[8] || ""),
          isArchived: Boolean(row[9] === true || row[9] === "TRUE" || row[9] === "true"),
          details: detailsStr,
          attachments: attachments,
          logs: logs
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
    } else if (e && e.parameter && e.parameter.payload) {
      try {
        body = JSON.parse(e.parameter.payload);
      } catch (ex) {
        body = {};
      }
    }

    if (body.action === "uploadImage" && body.image) {
      const res = saveImageToDrive(body.image, body.fileName);
      return respondJSON(res);
    }

    // 0. LINE Webhook 訊息處理 (來自 LINE Bot 的自動進件事件)
    if (body.events && Array.isArray(body.events)) {
      if (body.events.length === 0) {
        // LINE Verify 按鈕測試事件：0.1 秒極速回覆 200 OK，防止 LINE 控制台逾時 (Timeout)
        return respondJSON({ status: "success", message: "LINE Verify Success" });
      }
      const { ticketSheet, sysSheet } = getDbSheets();
      handleLineEvents(body.events, ticketSheet, sysSheet);
      return respondJSON({ status: "success", message: "LINE Webhook processed" });
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

    // 2. 更新單據資料 (穩定覆蓋版，支援 logs 時間軸紀錄)
    if (body.tickets && Array.isArray(body.tickets) && body.tickets.length > 0) {
      const lastRow = ticketSheet.getLastRow();
      if (lastRow > 1) {
        ticketSheet.getRange(2, 1, lastRow - 1, 15).clearContent();
      }

      const rowsToAppend = body.tickets.map(t => {
        return [
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
          formatDate(new Date()),
          t.issue || "",
          JSON.stringify(t.logs || [])
        ];
      });

      if (rowsToAppend.length > 0) {
        ticketSheet.getRange(2, 1, rowsToAppend.length, 15).setValues(rowsToAppend);
      }
    }

    return respondJSON({ status: "success", message: "資料同步儲存成功" });
  } catch (err) {
    return respondJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 處理來自 LINE Bot 的訊息事件 (通關密語機制)
 */
function handleLineEvents(events, ticketSheet, sysSheet) {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.type === "message" && event.message && event.message.type === "text") {
      const userText = event.message.text.trim();
      
      if (event.source) {
        if (event.source.type === "group" && event.source.groupId) {
          if (sysSheet) saveSystemSetting(sysSheet, "LINE_GROUP_ID", event.source.groupId);
        }
        if (event.source.userId) {
          if (sysSheet) saveSystemSetting(sysSheet, "LINE_USER_ID", event.source.userId);
        }
      }
      
      // 檢查通關密語/暗號 (例如包含 888 且包含報修/叫修/派工)
      const hasPasscode = !LINE_PASSCODE || userText.includes(LINE_PASSCODE);
      const isRepairKeyword = /(報修|叫修|派工)/.test(userText);

      if (hasPasscode && isRepairKeyword) {
        // 清除前綴關鍵字與通關密語
        let cleanText = userText.replace(/(報修|叫修|派工)/g, "").replace(new RegExp(LINE_PASSCODE, "g"), "").replace(/^[:：\s]+/, "").trim();
        
        let customer = "LINE 報修";
        let model = "未填寫";
        let issue = cleanText || "未填寫故障描述";
        let details = "【LINE 自動進件】\n" + userText;

        // 嘗試進階正則表達式解析 (支援「1.客戶名稱/經銷：」、「機型/機號：」、「故障問題：」等多種格式)
        let customerMatch = cleanText.match(/(?:客戶名稱\/經銷|客戶名稱|客戶|公司|店名)[：:]\s*([^\n]+)/);
        if (customerMatch) customer = customerMatch[1].trim();

        let modelMatch = cleanText.match(/(?:機型\/機號|機型|設備|機器)[：:]\s*([^\n]+)/);
        if (modelMatch) model = modelMatch[1].trim();

        let issueMatch = cleanText.match(/(?:故障問題|問題狀況|問題|故障|狀況|描述)[：:]\s*([\s\S]+)/);
        if (issueMatch) issue = issueMatch[1].trim();

        // 若無欄位標籤，將第一行為客戶名稱，第二行為機型 (Fallback 機制)
        const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l);
        if (customer === "LINE 報修" && lines.length >= 1 && !lines[0].includes("：") && !lines[0].includes(":")) {
          customer = lines[0];
          if (lines.length >= 2 && !lines[1].includes("：") && !lines[1].includes(":")) {
            model = lines[1];
            if (lines.length >= 3) {
              issue = lines.slice(2).join(" ");
            }
          }
        }

        // 生成新單號 T-XXXX
        const todayStr = formatDateOnly(new Date());
        const randomId = "T-" + Math.floor(1000 + Math.random() * 9000);

        // 寫入 Google Sheet (單據新增至底部)
        const newRow = [
          randomId,
          todayStr,
          customer,
          model,
          "未指派",
          3,
          "未執行",
          "",
          "",
          false,
          details,
          "[]",
          formatDate(new Date()),
          issue
        ];

        ticketSheet.appendRow(newRow);

        // 回覆 LINE 訊息
        if (event.replyToken) {
          replyLineMessage(event.replyToken, `✅ 【叫修自動登錄成功】\n📋 單號：${randomId}\n👤 客戶：${customer}\n🖥️ 機型：${model}\n🔧 狀況：${issue}\n\n已自動同步至管理系統「待指派」區域！`);
        }
      }
    }
  }
}

/**
 * 發送 LINE 回覆訊息
 */
function replyLineMessage(replyToken, text) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;
  const url = "https://api.line.me/v2/bot/message/reply";
  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: text }]
  };
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + LINE_CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
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
    const isPdf = contentType.includes('pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    const defaultName = isPdf ? ("repair_doc_" + new Date().getTime() + ".pdf") : ("repair_image_" + new Date().getTime() + ".jpg");
    
    const blob = Utilities.newBlob(bytes, contentType, fileName || defaultName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const url = isPdf ? ("https://drive.google.com/file/d/" + fileId + "/view") : ("https://lh3.googleusercontent.com/d/" + fileId);
    return { status: "success", url: url, fileId: fileId };
  } catch(err) {
    return { status: "error", message: err.toString() };
  }
}


function getSystemSetting(sysSheet, key) {
  const data = sysSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function saveSystemSetting(sysSheet, key, value) {
  const data = sysSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sysSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sysSheet.appendRow([key, value]);
}

function sendLineGroupDispatchNotification(targetId, ticket) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !targetId) return;
  const url = "https://api.line.me/v2/bot/message/push";
  const engName = (ticket.engineer || "未指派").split(" ")[0];
  const message = {
    to: targetId,
    messages: [
      {
        type: "text",
        text: `🔔 【新叫修派工通知】\n\n👤 負責工程師：@${engName}\n🏢 客戶名稱：${ticket.customer || "未填寫"}\n🔧 報修機型：${ticket.model || "未填寫"}\n⚠️ 問題狀況：${ticket.issue || "未填寫"}\n⏱️ 派工時效：${ticket.slaDays || 3} 天\n📝 詳細備註：${ticket.details || "無"}`
      }
    ]
  };
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  const text = resp.getContentText();
  Logger.log("LINE Push Response: " + code + " " + text);
  if (code !== 200) {
    throw new Error("LINE Push API 失敗 (" + code + "): " + text);
  }
}

function testSendPushNotification() {
  const { ss, sysSheet } = getDbSheets();
  appendPushLog(ss, "▶ 手動點擊「執行」測試推播功能中...");
  let targetId = getSystemSetting(sysSheet, "LINE_GROUP_ID") || getSystemSetting(sysSheet, "LINE_USER_ID");
  if (!targetId) {
    Logger.log("❌ 找不到 LINE_GROUP_ID 或 LINE_USER_ID");
    return;
  }
  const testTicket = {
    id: "TEST-001",
    customer: "測試客戶 - 全家門市",
    model: "測試機型 X-100",
    engineer: "廖聖典 Max",
    issue: "測試派工即時通知功能",
    slaDays: 3,
    details: "這是一則測試訊息，用以確認 LINE 推播功能已成功連線！"
  };
  sendLineGroupDispatchNotification(targetId, testTicket);
  Logger.log("✅ 已發送測試推播至 Target ID: " + targetId);
}


function appendPushLog(ss, msg) {
  try {
    let logSheet = ss.getSheetByName("推送日誌");
    if (!logSheet) {
      logSheet = ss.insertSheet("推送日誌");
      logSheet.appendRow(["時間", "詳細紀錄"]);
      logSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    }
    logSheet.appendRow([new Date().toLocaleString("zh-TW", {timeZone: "Asia/Taipei"}), msg]);
  } catch(e) {}
}


/**
 * 專用權限觸發測試：在選單選擇 testAuth 點擊「▶ 執行」，100% 強制觸發 DriveApp.Folder.createFile 完整授權視窗
 */
function testAuth() {
  const folder = getOrCreateDriveFolder();
  // 強制調用 createFile 觸發 Google Drive 完整寫入授權
  const testBlob = Utilities.newBlob("auth_verify", "text/plain", "auth_test.txt");
  const testFile = folder.createFile(testBlob);
  testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const fileId = testFile.getId();
  testFile.setTrashed(true); // 測試完成自動清理
  Logger.log('🎉 恭喜！Google Drive (包含 createFile) 完整權限已 100% 授權成功！測試檔案 ID: ' + fileId);
}
