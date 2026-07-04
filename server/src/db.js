const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "..", ".db");
const DB_PATH = path.join(DATA_DIR, "reports.db");

let db;

function getDb() {
  if (db) {
    return db;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  initSchema(db);
  return db;
}

function initSchema(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      game_key TEXT NOT NULL,
      locale TEXT,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_index INTEGER NOT NULL,
      question_id TEXT,
      selected_option TEXT,
      is_correct INTEGER NOT NULL,
      used_hint INTEGER NOT NULL,
      response_ms INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      session_id TEXT PRIMARY KEY,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      hints_used INTEGER NOT NULL,
      avg_response_ms REAL,
      score INTEGER NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_game ON sessions(game_key);
  `);
}

module.exports = {
  getDb,
  DB_PATH,
};
