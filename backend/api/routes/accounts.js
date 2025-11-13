const express = require("express");
const {
  saveAccount,
  getAccountByEmail,
  getAccountByPublicId,
  getAccountAuthByEmail,
  verifyPassword,
} = require("../storage/accountsStore");
const {
  DEFAULT_UNIVERSITY_ID,
  getUniversityById,
} = require("../universities");

const router = express.Router();

const isValidEmail = (value) =>
  typeof value === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());

const normalizeCourse = (value) => {
  const number = Number(String(value).replace(/[^\d]/g, ""));
  if (Number.isNaN(number) || number <= 0) {
    return null;
  }
  return Math.min(Math.max(number, 1), 10);
};

const resolveUniversity = (universityId) => {
  if (universityId) {
    const found = getUniversityById(universityId);
    if (found) {
      return found;
    }
  }
  return getUniversityById(DEFAULT_UNIVERSITY_ID);
};

const sanitizeScheduleProfile = (profile) => {
  if (
    !profile ||
    typeof profile !== "object" ||
    !profile.id ||
    !profile.type ||
    !profile.label
  ) {
    return null;
  }
  return {
    id: String(profile.id),
    type: String(profile.type),
    label: String(profile.label),
  };
};

const MIN_PASSWORD_LENGTH = 6;

router.post("/register", (req, res) => {
  const {
    fullName,
    email,
    course,
    groupLabel,
    universityId,
    scheduleProfile,
    password,
  } = req.body || {};

  const resolvedUniversity = resolveUniversity(universityId);
  if (!resolvedUniversity) {
    return res.status(400).json({ error: "Не выбран вуз" });
  }

  if (!fullName || String(fullName).trim().length < 5) {
    return res.status(400).json({ error: "Укажите полное ФИО" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Некорректная почта" });
  }

  const normalizedCourse = normalizeCourse(course);
  if (!normalizedCourse) {
    return res
      .status(400)
      .json({ error: "Укажите курс (числом от 1 до 10)" });
  }

  if (!groupLabel || String(groupLabel).trim().length < 2) {
    return res.status(400).json({ error: "Укажите вашу группу" });
  }

  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` });
  }

  const prepared = {
    fullName,
    email,
    course: String(normalizedCourse),
    groupLabel,
    universityId: resolvedUniversity.id,
    universityTitle: resolvedUniversity.title,
    scheduleProfile: sanitizeScheduleProfile(scheduleProfile),
    password: String(password),
  };

  try {
    const account = saveAccount(prepared);
    return res.json(account);
  } catch (error) {
    console.error("Register account failed", error);
    return res.status(500).json({ error: "Не удалось создать аккаунт" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Введите корректную почту" });
  }
  if (!password) {
    return res.status(400).json({ error: "Введите пароль" });
  }
  try {
    const authData = getAccountAuthByEmail(email.toLowerCase());
    if (!authData?.account) {
      return res
        .status(404)
        .json({ error: "Аккаунт не найден. Попробуйте зарегистрироваться." });
    }
    const isPasswordValid = verifyPassword(
      password,
      authData.passwordHash,
      authData.passwordSalt,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Неверный пароль" });
    }
    return res.json(authData.account);
  } catch (error) {
    console.error("Login failed", error);
    return res.status(500).json({ error: "Не удалось авторизоваться" });
  }
});

router.get("/:accountId", (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) {
    return res.status(400).json({ error: "Не передан идентификатор" });
  }
  try {
    const account = getAccountByPublicId(accountId);
    if (!account) {
      return res.status(404).json({ error: "Аккаунт не найден" });
    }
    return res.json(account);
  } catch (error) {
    console.error("Fetch account failed", error);
    return res.status(500).json({ error: "Не удалось получить данные" });
  }
});

module.exports = router;
