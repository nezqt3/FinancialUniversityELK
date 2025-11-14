const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SQLITE_BIN = process.env.SQLITE_BIN || "sqlite3";
const DEFAULT_DATA_DIR = path.join(__dirname, "..", "storage", "data");
const FALLBACK_TMP_DIR = path.join(
  process.env.MAX_MINIAPP_TMP_DIR || os.tmpdir(),
  "max-miniapp",
);

const resolveInitialDbPath = () => {
  if (process.env.MAX_MINIAPP_DB_PATH) {
    return process.env.MAX_MINIAPP_DB_PATH;
  }
  const dataDir = process.env.MAX_MINIAPP_DB_DIR || DEFAULT_DATA_DIR;
  return path.join(dataDir, "max-miniapp.db");
};

let DB_PATH = resolveInitialDbPath();
let driverType = null;
let embeddedDb = null;

const isReadOnlyError = (error) =>
  Boolean(error) &&
  ["EACCES", "EROFS", "EPERM", "ENOENT"].includes(error.code);

const ensureDataDir = () => {
  const targetDir = path.dirname(DB_PATH);
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    return;
  } catch (error) {
    if (!isReadOnlyError(error)) {
      throw error;
    }
    const fallbackDir = FALLBACK_TMP_DIR;
    fs.mkdirSync(fallbackDir, { recursive: true });
    DB_PATH = path.join(fallbackDir, path.basename(DB_PATH));
    console.warn(
      `SQLite storage switched to temporary dir: ${DB_PATH} (original path is read-only)`,
    );
  }
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  const normalized = String(value);
  return `'${normalized.replace(/'/g, "''")}'`;
};

const buildSql = (sql, params = {}) => {
  if (!params) {
    return sql.trim();
  }

  if (Array.isArray(params)) {
    let index = 0;
    return sql.replace(/\?/g, () => {
      if (index >= params.length) {
        throw new Error("Недостаточно параметров SQL");
      }
      const value = params[index];
      index += 1;
      return formatValue(value);
    });
  }

  return sql.replace(/:(\w+)/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      throw new Error(`Отсутствует значение для параметра :${key}`);
    }
    return formatValue(params[key]);
  });
};

const runSqliteCli = (argsOrBuilder) => {
  ensureDataDir();
  const args =
    typeof argsOrBuilder === "function"
      ? argsOrBuilder(DB_PATH)
      : argsOrBuilder;
  return execFileSync(SQLITE_BIN, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
};

const ensureEmbeddedDb = () => {
  if (embeddedDb) {
    return embeddedDb;
  }
  ensureDataDir();
  const Database = require("better-sqlite3");
  embeddedDb = new Database(DB_PATH);
  embeddedDb.pragma("journal_mode = WAL");
  console.warn("SQLite CLI is unavailable. Using better-sqlite3 driver.");
  return embeddedDb;
};

const detectDriver = () => {
  if (driverType) {
    return driverType;
  }

  const forceEmbedded =
    process.env.MAX_MINIAPP_FORCE_EMBEDDED === "1" ||
    process.env.VERCEL === "1";

  if (!forceEmbedded) {
    try {
      runSqliteCli(["-version"]);
      driverType = "cli";
      return driverType;
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn("sqlite3 CLI check failed, switching to embedded driver.", {
          message: error.message,
        });
      }
    }
  }

  ensureEmbeddedDb();
  driverType = "embedded";
  return driverType;
};

const execute = (sql, params = {}) => {
  const finalSql = buildSql(sql, params);
  const driver = detectDriver();
  if (driver === "cli") {
    try {
      runSqliteCli((dbPath) => [dbPath, finalSql.trim()]);
      return;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      driverType = "embedded";
    }
  }
  const db = ensureEmbeddedDb();
  db.exec(finalSql.trim());
};

const query = (sql, params = {}) => {
  const finalSql = buildSql(sql, params);
  const driver = detectDriver();
  if (driver === "cli") {
    try {
      const output = runSqliteCli((dbPath) => [
        "-json",
        dbPath,
        finalSql.trim(),
      ]);
      const normalized = output.trim();
      if (!normalized) {
        return [];
      }
      try {
        return JSON.parse(normalized);
      } catch (error) {
        throw new Error(`Не удалось распарсить ответ SQLite: ${error.message}`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      driverType = "embedded";
    }
  }
  const db = ensureEmbeddedDb();
  const statement = db.prepare(finalSql.trim());
  return statement.all();
};

module.exports = {
  get DB_PATH() {
    return DB_PATH;
  },
  execute,
  query,
};
