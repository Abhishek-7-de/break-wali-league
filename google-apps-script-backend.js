/**
 * ============================================================
 * BREAK WALI LEAGUE — Google Apps Script Backend
 * ============================================================
 * DEPLOY INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a New Project → paste this entire file
 * 3. Click "Deploy" → "New Deployment"
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (anonymous)
 * 4. Copy the Web App URL
 * 5. Paste that URL into index.html as SHEET_API_URL
 *
 * GOOGLE SHEET SETUP:
 * 1. Create a new Google Sheet
 * 2. Copy the Sheet ID from its URL
 *    (https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit)
 * 3. Paste the Sheet ID below into SPREADSHEET_ID
 *
 * SMS OTP (Fast2SMS — Free Indian SMS):
 * 1. Go to https://www.fast2sms.com → Register (free)
 * 2. Go to API → DLT Route → copy your API Key
 * 3. Paste it below into FAST2SMS_API_KEY
 * ============================================================
 */

// ── CONFIGURATION ──────────────────────────────────────────
const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";   // ← Paste your Sheet ID
const FAST2SMS_API_KEY = "YOUR_FAST2SMS_API_KEY_HERE"; // ← Paste Fast2SMS key
const MASTER_OTP = "250326";    // Admin bypass OTP (same as in index.html)
const OTP_EXPIRY_MINUTES = 10;  // OTP valid for 10 minutes
// ────────────────────────────────────────────────────────────

// Sheet tab names (auto-created if missing)
const SHEET_REGISTRATIONS = "Registrations";
const SHEET_GAME_PLAYS = "GamePlays";
const SHEET_OTP_STORE = "OTP_Store";  // Temp OTP storage (hidden sheet)

/**
 * GET/POST router — handles all requests from the game app
 */
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    // Support both GET params and POST JSON body
    let params = e.parameter || {};
    if (e.postData && e.postData.contents) {
      try { Object.assign(params, JSON.parse(e.postData.contents)); } catch(ex) {}
    }

    const action = params.action;
    let result;

    switch(action) {
      case "sendOTP":
        result = sendOTP(params.phone, params.name, params.nick || "");
        break;
      case "verifyOTP":
        result = verifyOTP(params.phone, params.otp);
        break;
      case "logPlay":
        result = logGamePlay(params);
        break;
      case "getLeaderboard":
        result = getLeaderboard(Number(params.limit)||50);
        break;
      case "ping":
        result = { ok: true, msg: "BWL Backend alive" };
        break;
      default:
        result = { ok: false, error: "Unknown action: " + action };
    }

    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ── OTP: SEND ───────────────────────────────────────────────
function sendOTP(phone, name, nick) {
  if (!phone || !/^\d{10}$/.test(phone)) {
    return { ok: false, error: "Invalid phone number" };
  }

  const otp = generateOTP();
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Store OTP in sheet (keyed by phone)
  storeOTP(phone, otp, expires, name, nick);

  // Send SMS via Fast2SMS
  const smsSent = sendSMS(phone, otp);

  // Log attempt
  console.log(`OTP for ${phone}: ${otp} | SMS sent: ${smsSent}`);

  return {
    ok: true,
    smsSent: smsSent,
    // For debugging ONLY — remove before production:
    // debug_otp: otp
    msg: smsSent ? "OTP sent via SMS" : "OTP generated (SMS failed — check API key)"
  };
}

// ── OTP: VERIFY ─────────────────────────────────────────────
function verifyOTP(phone, otp) {
  if (!phone || !otp) {
    return { ok: false, error: "Missing phone or OTP" };
  }

  // Master OTP bypass (admin testing)
  if (otp === MASTER_OTP) {
    return { ok: true, verified: true, method: "master", phone: phone };
  }

  const stored = getStoredOTP(phone);
  if (!stored) {
    return { ok: false, error: "No OTP found for this number. Please request a new OTP." };
  }

  // Check expiry
  if (new Date() > new Date(stored.expires)) {
    clearOTP(phone);
    return { ok: false, error: "OTP expired. Please request a new one." };
  }

  // Check OTP
  if (stored.otp !== otp) {
    return { ok: false, error: "Incorrect OTP. Try again." };
  }

  // Success — clear the OTP and register user
  clearOTP(phone);
  registerUser(phone, stored.name, stored.nick);

  return {
    ok: true,
    verified: true,
    method: "otp",
    phone: phone,
    name: stored.name
  };
}

// ── LOG GAME PLAY ────────────────────────────────────────────
function logGamePlay(params) {
  const {
    phone = "", name = "", nick = "",
    mode = "",      // "bat" or "bowl"
    outcome = "",   // e.g. "6", "4", "Bowled"
    pts = 0,
    boost = 1,
    totalPts = 0,
    runs = 0,
    wickets = 0,
    sixes = 0,
    matchesPlayed = 0,
    overComplete = false,
    overRuns = 0,
    overWickets = 0,
    overPts = 0
  } = params;

  const ss = getOrCreateSheet(SHEET_GAME_PLAYS);
  const now = new Date();

  // Add header row if sheet is empty
  if (ss.getLastRow() === 0) {
    ss.appendRow([
      "Timestamp", "Date", "Time", "Phone", "Name", "Nick",
      "Mode", "Outcome", "Points", "Boost", "TotalPoints",
      "Runs", "Wickets", "Sixes", "BallsPlayed",
      "OverComplete", "OverRuns", "OverWickets", "OverPoints"
    ]);
    formatHeaderRow(ss);
  }

  ss.appendRow([
    now.toISOString(),
    now.toLocaleDateString("en-IN"),
    now.toLocaleTimeString("en-IN"),
    phone,
    name,
    nick || name,
    mode.toUpperCase(),
    outcome,
    pts,
    boost > 1 ? "2× BOOST" : "Normal",
    totalPts,
    runs,
    wickets,
    sixes,
    matchesPlayed,
    overComplete ? "YES" : "",
    overComplete ? overRuns : "",
    overComplete ? overWickets : "",
    overComplete ? overPts : ""
  ]);

  return { ok: true, logged: true };
}

// ── GET LEADERBOARD ──────────────────────────────────────────
function getLeaderboard(limit) {
  limit = limit || 50;
  try {
    const ss = getOrCreateSheet(SHEET_GAME_PLAYS);
    if (ss.getLastRow() <= 1) return { ok: true, players: [] };
    const data = ss.getDataRange().getValues();
    // Headers: Timestamp, Date, Time, Phone, Name, Nick, Mode, Outcome, Points, Boost, TotalPoints, Runs, Wickets, Sixes, BallsPlayed...
    // We want the LATEST TotalPoints row per phone (highest row = most recent)
    const byPhone = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const phone = String(row[3] || "").trim();
      const name  = String(row[4] || "").trim();
      const nick  = String(row[5] || "").trim();
      const totalPts = Number(row[10]) || 0;
      const runs  = Number(row[11]) || 0;
      const wickets = Number(row[12]) || 0;
      const sixes = Number(row[13]) || 0;
      if (!phone) continue;
      // Keep the row with the highest TotalPoints for each phone
      if (!byPhone[phone] || totalPts > byPhone[phone].totalPts) {
        byPhone[phone] = { phone, name, nick, totalPts, runs, wickets, sixes };
      }
    }
    const players = Object.values(byPhone)
      .sort(function(a, b) { return b.totalPts - a.totalPts; })
      .slice(0, limit);
    return { ok: true, players: players };
  } catch(err) {
    return { ok: false, error: err.toString(), players: [] };
  }
}

// ── REGISTER USER ────────────────────────────────────────────
function registerUser(phone, name, nick) {
  const ss = getOrCreateSheet(SHEET_REGISTRATIONS);
  const now = new Date();

  // Check if phone already registered (update existing row)
  const data = ss.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(phone)) {
      // Update last login time
      ss.getRange(i + 1, 5).setValue(now.toLocaleString("en-IN"));
      ss.getRange(i + 1, 6).setValue(
        Number(ss.getRange(i + 1, 6).getValue() || 0) + 1
      );
      return; // Already registered, just updated
    }
  }

  // New user — add header if needed
  if (ss.getLastRow() === 0) {
    ss.appendRow([
      "Phone", "Name", "Nickname", "Registered At", "Last Login", "Login Count"
    ]);
    formatHeaderRow(ss);
  }

  ss.appendRow([
    phone,
    name,
    nick || name,
    now.toLocaleString("en-IN"),
    now.toLocaleString("en-IN"),
    1
  ]);
}

// ── OTP STORAGE ──────────────────────────────────────────────
function storeOTP(phone, otp, expires, name, nick) {
  const ss = getOrCreateSheet(SHEET_OTP_STORE);

  // Add or update OTP row for this phone
  const data = ss.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(phone)) {
      ss.getRange(i + 1, 1, 1, 5).setValues([[phone, otp, expires, name, nick || ""]]);
      return;
    }
  }
  ss.appendRow([phone, otp, expires, name, nick || ""]);
}

function getStoredOTP(phone) {
  const ss = getOrCreateSheet(SHEET_OTP_STORE);
  const data = ss.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(phone)) {
      return {
        phone: data[i][0],
        otp: String(data[i][1]),
        expires: data[i][2],
        name: data[i][3],
        nick: data[i][4] || ""
      };
    }
  }
  return null;
}

function clearOTP(phone) {
  const ss = getOrCreateSheet(SHEET_OTP_STORE);
  const data = ss.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(phone)) {
      ss.deleteRow(i + 1);
      return;
    }
  }
}

// ── SMS: FAST2SMS ─────────────────────────────────────────────
function sendSMS(phone, otp) {
  if (!FAST2SMS_API_KEY || FAST2SMS_API_KEY === "YOUR_FAST2SMS_API_KEY_HERE") {
    console.log(`[SMS SKIP] No API key. OTP for ${phone}: ${otp}`);
    return false;
  }

  try {
    const url = "https://www.fast2sms.com/dev/bulkV2";
    const payload = {
      route: "q",           // Quick SMS (transactional)
      message: `Your Break Wali League OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
      language: "english",
      flash: 0,
      numbers: phone
    };

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: { authorization: FAST2SMS_API_KEY },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    console.log("Fast2SMS response:", JSON.stringify(result));
    return result.return === true;
  } catch(err) {
    console.error("SMS error:", err);
    return false;
  }
}

// ── UTILITIES ─────────────────────────────────────────────────
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOrCreateSheet(name) {
  const wb = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = wb.getSheetByName(name);
  if (!sheet) {
    sheet = wb.insertSheet(name);
  }
  return sheet;
}

function formatHeaderRow(sheet) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground("#1a1a2e");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  } catch(e) {}
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
