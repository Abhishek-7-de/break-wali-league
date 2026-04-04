/**
 * ============================================================
 * BREAK WALI LEAGUE — Google Apps Script Backend
 * ============================================================
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com
 * 2. Open your project (or create new)
 * 3. Select all code → paste this entire file → Ctrl+S to save
 * 4. Click "Deploy" → "Manage Deployments"
 * 5. Edit existing deployment → Version: "New version" → Deploy
 *    (OR if first time: Deploy → New Deployment → Web App
 *     Execute as: Me | Who has access: Anyone)
 * ============================================================
 */

// ── CONFIGURATION ──────────────────────────────────────────
const SPREADSHEET_ID = "1q05bFEMiJJRxxf7Cm-ciI7w7_2DhMc6FkwRK-IPOAEc";
const MASTER_OTP     = "250326"; // Admin bypass OTP (same as in index.html)
// ────────────────────────────────────────────────────────────

// Sheet tab names (auto-created if missing)
const SHEET_REGISTRATIONS = "Registrations";
const SHEET_GAME_PLAYS    = "GamePlays";

// ── ROUTER ──────────────────────────────────────────────────
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    if (e.postData && e.postData.contents) {
      try { Object.assign(params, JSON.parse(e.postData.contents)); } catch(ex) {}
    }
    var action = params.action;
    var result;
    switch (action) {
      case "logPlay":
        result = logGamePlay(params);
        break;
      case "getLeaderboard":
        result = getLeaderboard(Number(params.limit) || 50);
        break;
      case "getUserStats":
        result = getUserStats(params.phone);
        break;
      case "register":
        result = registerUser(params.phone, params.name, params.nick || "");
        break;
      case "ping":
        result = { ok: true, msg: "BWL Backend alive ✅" };
        break;
      default:
        result = { ok: false, error: "Unknown action: " + action };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ── LOG GAME PLAY ────────────────────────────────────────────
function logGamePlay(params) {
  var phone         = params.phone        || "";
  var name          = params.name         || "";
  var nick          = params.nick         || name;
  var mode          = params.mode         || "";
  var outcome       = params.outcome      || "";
  var pts           = Number(params.pts)  || 0;
  var boost         = Number(params.boost)|| 1;
  var totalPts      = Number(params.totalPts) || 0;
  var runs          = Number(params.runs)     || 0;
  var wickets       = Number(params.wickets)  || 0;
  var sixes         = Number(params.sixes)    || 0;
  var matchesPlayed = Number(params.matchesPlayed) || 0;
  var overComplete  = params.overComplete === "true" || params.overComplete === true;
  var overRuns      = Number(params.overRuns)   || 0;
  var overWickets   = Number(params.overWickets)|| 0;
  var overPts       = Number(params.overPts)    || 0;

  var ss  = getOrCreateSheet(SHEET_GAME_PLAYS);
  var now = new Date();

  // Add header row if sheet is empty
  if (ss.getLastRow() === 0) {
    ss.appendRow([
      "Timestamp","Date","Time","Phone","Name","Nick",
      "Mode","Outcome","Points","Boost","TotalPoints",
      "Runs","Wickets","Sixes","BallsPlayed",
      "OverComplete","OverRuns","OverWickets","OverPoints"
    ]);
    formatHeaderRow(ss);
  }

  ss.appendRow([
    now.toISOString(),
    now.toLocaleDateString("en-IN"),
    now.toLocaleTimeString("en-IN"),
    phone, name, nick || name,
    mode.toUpperCase(),
    outcome,
    pts,
    boost > 1 ? "2× BOOST" : "Normal",
    totalPts,
    runs, wickets, sixes, matchesPlayed,
    overComplete ? "YES" : "",
    overComplete ? overRuns    : "",
    overComplete ? overWickets : "",
    overComplete ? overPts     : ""
  ]);

  return { ok: true, logged: true };
}

// ── GET LEADERBOARD ──────────────────────────────────────────
// Returns top N players sorted by their highest recorded TotalPoints
function getLeaderboard(limit) {
  limit = limit || 50;
  try {
    var ss = getOrCreateSheet(SHEET_GAME_PLAYS);
    if (ss.getLastRow() <= 1) return { ok: true, players: [] };

    var data = ss.getDataRange().getValues();
    // Col indices (0-based): 3=Phone, 4=Name, 5=Nick, 10=TotalPoints, 11=Runs, 12=Wickets, 13=Sixes
    var byPhone = {};
    for (var i = 1; i < data.length; i++) {
      var row      = data[i];
      var phone    = String(row[3] || "").trim();
      var name     = String(row[4] || "").trim();
      var nick     = String(row[5] || "").trim();
      var totalPts = Number(row[10]) || 0;
      var runs     = Number(row[11]) || 0;
      var wickets  = Number(row[12]) || 0;
      var sixes    = Number(row[13]) || 0;
      if (!phone) continue;
      // Keep the entry with the highest TotalPoints per phone
      if (!byPhone[phone] || totalPts > byPhone[phone].totalPts) {
        byPhone[phone] = { phone: phone, name: name, nick: nick, totalPts: totalPts, runs: runs, wickets: wickets, sixes: sixes };
      }
    }

    var players = Object.values(byPhone)
      .sort(function(a, b) { return b.totalPts - a.totalPts; })
      .slice(0, limit);

    return { ok: true, players: players };
  } catch(err) {
    return { ok: false, error: err.toString(), players: [] };
  }
}

// ── GET USER STATS ───────────────────────────────────────────
// Returns the most recent total scores for a specific phone number
function getUserStats(phone) {
  try {
    var ss = getOrCreateSheet(SHEET_GAME_PLAYS);
    if (ss.getLastRow() <= 1) return { ok: true, stats: null };
    
    var data = ss.getDataRange().getValues();
    // Search from bottom up for the latest entry
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      if (String(row[3] || "").trim() === String(phone).trim()) {
        return {
          ok: true,
          stats: {
            totalPoints: Number(row[10]) || 0,
            runs: Number(row[11]) || 0,
            wickets: Number(row[12]) || 0,
            sixes: Number(row[13]) || 0,
            matchesPlayed: Number(row[14]) || 0
          }
        };
      }
    }
    return { ok: true, stats: null };
  } catch(err) {
    return { ok: false, error: err.toString(), stats: null };
  }
}

// ── REGISTER USER ────────────────────────────────────────────
// Logs new user registrations to the Registrations sheet
function registerUser(phone, name, nick) {
  var ss  = getOrCreateSheet(SHEET_REGISTRATIONS);
  var now = new Date();

  var data = ss.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(phone)) {
      // Update last login & login count
      ss.getRange(i + 1, 5).setValue(now.toLocaleString("en-IN"));
      ss.getRange(i + 1, 6).setValue(Number(ss.getRange(i + 1, 6).getValue() || 0) + 1);
      return { ok: true, updated: true };
    }
  }

  // New user — add header if empty
  if (ss.getLastRow() === 0) {
    ss.appendRow(["Phone","Name","Nickname","Registered At","Last Login","Login Count"]);
    formatHeaderRow(ss);
  }

  ss.appendRow([phone, name, nick || name, now.toLocaleString("en-IN"), now.toLocaleString("en-IN"), 1]);
  return { ok: true, registered: true };
}

// ── UTILITIES ─────────────────────────────────────────────────
function getOrCreateSheet(name) {
  var wb    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = wb.getSheetByName(name);
  if (!sheet) sheet = wb.insertSheet(name);
  return sheet;
}

function formatHeaderRow(sheet) {
  try {
    var r = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    r.setBackground("#1a1a2e");
    r.setFontColor("#ffffff");
    r.setFontWeight("bold");
    sheet.setFrozenRows(1);
  } catch(e) {}
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
