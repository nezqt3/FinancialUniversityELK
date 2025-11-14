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

const runSqlite = (argsOrBuilder) => {
  ensureDataDir();
  const args =
    typeof argsOrBuilder === "function"
      ? argsOrBuilder(DB_PATH)
      : argsOrBuilder;
  try {
    return execFileSync(SQLITE_BIN, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    const message = stderr || stdout || error.message || "SQLite error";
    throw new Error(message);
  }
};

const execute = (sql, params = {}) => {
  const finalSql = buildSql(sql, params);
  runSqlite((dbPath) => [dbPath, finalSql.trim()]);
};

const query = (sql, params = {}) => {
  const finalSql = buildSql(sql, params);
  const output = runSqlite((dbPath) => ["-json", dbPath, finalSql.trim()]);
  const normalized = output.trim();
  if (!normalized) {
    return [];
  }
  try {
    return JSON.parse(normalized);
  } catch (error) {
    throw new Error(`Не удалось распарсить ответ SQLite: ${error.message}`);
  }
};

module.exports = {
  get DB_PATH() {
    return DB_PATH;
  },
  execute,
  query,
};
