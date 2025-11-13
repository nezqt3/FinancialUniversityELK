const {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require("node:crypto");
const { execute, query } = require("./sqliteClient");

let isInitialized = false;

const ensureSchema = () => {
  if (isInitialized) {
    return;
  }

  execute("PRAGMA journal_mode=WAL;");
  execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      university_id TEXT NOT NULL,
      university_title TEXT NOT NULL,
      course TEXT NOT NULL,
      group_label TEXT NOT NULL,
      schedule_profile_id TEXT,
      schedule_profile_type TEXT,
      schedule_profile_label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  execute(
    `CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);`,
  );
  execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_public_id ON accounts(public_id);`,
  );

  const columns = query(`PRAGMA table_info(accounts);`);
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("password_hash")) {
    execute(`ALTER TABLE accounts ADD COLUMN password_hash TEXT;`);
  }
  if (!columnNames.has("password_salt")) {
    execute(`ALTER TABLE accounts ADD COLUMN password_salt TEXT;`);
  }

  isInitialized = true;
};

const mapRow = (row) => {
  if (!row) {
    return null;
  }

  const scheduleProfile = row.schedule_profile_id
    ? {
        id: row.schedule_profile_id,
        type: row.schedule_profile_type,
        label: row.schedule_profile_label || row.group_label,
      }
    : null;

  return {
    id: row.public_id,
    fullName: row.full_name,
    email: row.email,
    universityId: row.university_id,
    universityTitle: row.university_title,
    course: row.course,
    groupLabel: row.group_label,
    scheduleProfile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const createPasswordRecord = (password) => {
  const normalized = String(password || "");
  if (normalized.length < 1) {
    throw new Error("Password is required");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalized, salt, 64);
  return {
    salt,
    hash: hash.toString("hex"),
  };
};

const verifyPassword = (password, hash, salt) => {
  if (
    !password ||
    !hash ||
    !salt ||
    typeof hash !== "string" ||
    typeof salt !== "string"
  ) {
    return false;
  }
  try {
    const hashBuffer = Buffer.from(hash, "hex");
    const candidate = scryptSync(String(password), salt, hashBuffer.length);
    return (
      hashBuffer.length === candidate.length &&
      timingSafeEqual(hashBuffer, candidate)
    );
  } catch (error) {
    console.error("Password verification failed", error);
    return false;
  }
};

const getAccountByEmail = (email) => {
  ensureSchema();
  if (!email) {
    return null;
  }
  const rows = query(
    `SELECT * FROM accounts WHERE email = :email LIMIT 1;`,
    {
      email: email.toLowerCase(),
    },
  );
  return mapRow(rows[0]);
};

const getAccountByPublicId = (publicId) => {
  ensureSchema();
  if (!publicId) {
    return null;
  }
  const rows = query(
    `SELECT * FROM accounts WHERE public_id = :publicId LIMIT 1;`,
    {
      publicId,
    },
  );
  return mapRow(rows[0]);
};

const getAccountAuthByEmail = (email) => {
  ensureSchema();
  if (!email) {
    return null;
  }
  const rows = query(
    `SELECT * FROM accounts WHERE email = :email LIMIT 1;`,
    {
      email: email.toLowerCase(),
    },
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    account: mapRow(row),
    passwordHash: row.password_hash || null,
    passwordSalt: row.password_salt || null,
  };
};

const prepareScheduleParams = (scheduleProfile) => {
  if (!scheduleProfile) {
    return {
      scheduleProfileId: null,
      scheduleProfileType: null,
      scheduleProfileLabel: null,
    };
  }
  return {
    scheduleProfileId: scheduleProfile.id ?? null,
    scheduleProfileType: scheduleProfile.type ?? null,
    scheduleProfileLabel: scheduleProfile.label ?? null,
  };
};

const saveAccount = (payload) => {
  ensureSchema();
  const {
    fullName,
    email,
    course,
    groupLabel,
    universityId,
    universityTitle,
    scheduleProfile,
    password,
  } = payload;

  const normalizedEmail = String(email).toLowerCase();
  const normalizedFullName = String(fullName).trim();
  const normalizedGroup = String(groupLabel).trim();
  const normalizedCourse = String(course ?? "").trim();
  const passwordRecord = createPasswordRecord(password);

  const scheduleParams = prepareScheduleParams(scheduleProfile);

  const existing = getAccountByEmail(normalizedEmail);
  if (existing) {
    execute(
      `
        UPDATE accounts
        SET
          full_name = :fullName,
          course = :course,
          group_label = :groupLabel,
          university_id = :universityId,
          university_title = :universityTitle,
          schedule_profile_id = :scheduleProfileId,
          schedule_profile_type = :scheduleProfileType,
          schedule_profile_label = :scheduleProfileLabel,
          password_hash = :passwordHash,
          password_salt = :passwordSalt,
          updated_at = datetime('now')
        WHERE public_id = :publicId;
      `,
      {
        publicId: existing.id,
        fullName: normalizedFullName,
        course: normalizedCourse,
        groupLabel: normalizedGroup,
        universityId,
        universityTitle,
        passwordHash: passwordRecord.hash,
        passwordSalt: passwordRecord.salt,
        ...scheduleParams,
      },
    );
    return getAccountByPublicId(existing.id);
  }

  const publicId = randomUUID();

  execute(
    `
      INSERT INTO accounts (
        public_id,
        full_name,
        email,
        university_id,
        university_title,
        course,
        group_label,
        schedule_profile_id,
        schedule_profile_type,
        schedule_profile_label,
        password_hash,
        password_salt
      )
      VALUES (
        :publicId,
        :fullName,
        :email,
        :universityId,
        :universityTitle,
        :course,
        :groupLabel,
        :scheduleProfileId,
        :scheduleProfileType,
        :scheduleProfileLabel,
        :passwordHash,
        :passwordSalt
      );
    `,
    {
      publicId,
      fullName: normalizedFullName,
      email: normalizedEmail,
      universityId,
      universityTitle,
      course: normalizedCourse,
      groupLabel: normalizedGroup,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      ...scheduleParams,
    },
  );

  return getAccountByPublicId(publicId);
};

module.exports = {
  saveAccount,
  getAccountByEmail,
  getAccountByPublicId,
  getAccountAuthByEmail,
  verifyPassword,
};
