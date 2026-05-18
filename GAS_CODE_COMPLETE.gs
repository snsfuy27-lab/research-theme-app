const SPREADSHEET_ID = "1YA8klfWsMpSTeI0TszA0A8Wf04i2ly7FZJqVJ_6qrGs";
const SHEET_NAME = "シート1";

/** GET確認用。ブラウザで /exec を開いたとき GAS RUNNING が出れば公開自体は成功。 */
function doGet(e) {
  if (!e || !e.parameter || !e.parameter.payload) {
    return createResponse(true, "GAS RUNNING");
  }

  try {
    const payload = JSON.parse(e.parameter.payload);
    return appendPayload(payload, "GET");
  } catch (error) {
    return createResponse(false, String(error));
  }
}

/** GitHub Pages からは text/plain の no-cors POST で送る。 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse(false, "postData.contents が空です");
    }

    const payload = JSON.parse(e.postData.contents);
    return appendPayload(payload, "POST");
  } catch (error) {
    return createResponse(false, String(error));
  }
}

/** Spreadsheetへ追加する本体。 */
function appendPayload(payload, method) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("シートが見つかりません: " + SHEET_NAME);
    }

    ensureHeader(sheet);

    const timestamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

    const studentId = sanitize(payload.studentId);
    const researchType = sanitize(payload.researchType);
    const title = sanitize(payload.title);
    const c1 = sanitize(payload.c1);
    const c2 = sanitize(payload.c2);
    const c3 = sanitize(payload.c3);
    const c4 = sanitize(payload.c4);
    const hypothesis = sanitize(payload.hypothesis);
    const memo = sanitize(payload.memo);
    const clientTimestamp = sanitize(payload.clientTimestamp);
    const trialNumber = sanitize(payload.trialNumber);
    const rubricScore = sanitize(payload.rubricScore);
    const measurementScore = sanitize(payload.measurementScore);

    if (!isValidStudentId(studentId)) {
      return createResponse(false, "番号と氏名の形式が不正です: " + studentId);
    }
    if (!isValidTerm(c1)) {
      return createResponse(false, "C1が不正です: " + c1);
    }
    if (!isValidTerm(c2)) {
      return createResponse(false, "C2が不正です: " + c2);
    }
    if (!isValidTerm(c3)) {
      return createResponse(false, "C3が不正です: " + c3);
    }

    sheet.appendRow([
      timestamp,
      method,
      studentId,
      researchType,
      title,
      c1,
      c2,
      c3,
      c4,
      hypothesis,
      memo,
      clientTimestamp,
      trialNumber,
      rubricScore,
      measurementScore
    ]);

    return createResponse(true, "登録完了");
  } catch (error) {
    return createResponse(false, String(error));
  } finally {
    lock.releaseLock();
  }
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    "serverTimestamp",
    "method",
    "studentId",
    "researchType",
    "title",
    "c1",
    "c2",
    "c3",
    "c4",
    "hypothesis",
    "memo",
    "clientTimestamp",
    "trialNumber",
    "rubricScore",
    "measurementScore"
  ]);
}

function sanitize(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function isValidStudentId(value) {
  return /^\d{5}.+/.test(String(value || "").trim());
}

function isValidTerm(value) {
  const s = String(value || "").trim();
  if (s.length < 2) return false;
  if (/^[0-9０-９]+$/.test(s)) return false;
  if (/^[a-zA-Z]+$/.test(s)) return false;
  return true;
}

function createResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
