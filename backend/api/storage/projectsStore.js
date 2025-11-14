const { randomUUID } = require("node:crypto");
const { execute, query } = require("./sqliteClient");

let isInitialized = false;

const ensureSchema = () => {
  if (isInitialized) {
    return;
  }
  execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  isInitialized = true;
};

const parseRow = (row) => {
  if (!row || !row.payload) {
    return null;
  }
  try {
    return JSON.parse(row.payload);
  } catch (error) {
    console.error("Failed to parse project row", error);
    return null;
  }
};

const listProjects = () => {
  ensureSchema();
  const rows = query(
    `SELECT payload FROM projects ORDER BY datetime(updated_at) DESC;`,
  );
  return rows.map(parseRow).filter(Boolean);
};

const getProjectById = (projectId) => {
  ensureSchema();
  const rows = query(
    `SELECT payload FROM projects WHERE id = :id LIMIT 1;`,
    { id: projectId },
  );
  return parseRow(rows[0]);
};

const saveProject = (project) => {
  ensureSchema();
  if (!project || typeof project !== "object") {
    throw new Error("project payload is required");
  }
  const id = project.id || randomUUID();
  const now = new Date().toISOString();
  const record = {
    ...project,
    id,
    createdAt: project.createdAt || now,
    updatedAt: now,
  };
  const payload = JSON.stringify(record);
  execute(
    `
      INSERT INTO projects (id, payload, created_at, updated_at)
      VALUES (:id, :payload, :createdAt, :updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at;
    `,
    {
      id,
      payload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  );
  return record;
};

const deleteProject = (projectId) => {
  ensureSchema();
  execute(`DELETE FROM projects WHERE id = :id;`, { id: projectId });
};

module.exports = {
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
};
