const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SQLITE_BIN = process.env.SQLITE_BIN || "sqlite3";
const DATA_DIR =
  process.env.MAX_MINIAPP_DB_DIR ||
  path.join(__dirname, "..", "storage", "data");
const DB_PATH =
  process.env.MAX_MINIAPP_DB_PATH ||
  path.join(DATA_DIR, "max-miniapp.db");

const ensureDataDir = () => {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
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

const runSqlite = (args) => {
  ensureDataDir();
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
  runSqlite([DB_PATH, finalSql.trim()]);
};

const query = (sql, params = {}) => {
  const finalSql = buildSql(sql, params);
  const output = runSqlite(["-json", DB_PATH, finalSql.trim()]);
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
  DB_PATH,
  execute,
  query,
};
