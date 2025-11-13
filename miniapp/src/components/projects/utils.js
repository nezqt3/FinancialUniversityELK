import { UNIVERSITIES as CONFIG_UNIVERSITIES } from "../../config/universities";

export const VIEW_MODES = {
  AVAILABLE: "available",
  MINE: "mine",
};

export const PROGRAM_UNIVERSITIES = CONFIG_UNIVERSITIES.map((university) => ({
  id: university.id,
  title: university.title,
  label: university.shortTitle || university.title,
}));

const UNIVERSITY_LOOKUP = PROGRAM_UNIVERSITIES.map((university) => {
  const searchValues = [university.id, university.title, university.label]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  return {
    ...university,
    searchValues,
  };
});

export const findUniversityMatch = (value) => {
  if (!value) {
    return null;
  }
  const normalized = value.toString().trim().toLowerCase();
  return (
    UNIVERSITY_LOOKUP.find((item) => item.searchValues.includes(normalized)) ||
    null
  );
};

export const formatUniversityList = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => {
      const match = findUniversityMatch(value);
      return match?.label || value;
    })
    .filter(Boolean);
};

export const simulateRequest = (result, ms = 400) =>
  new Promise((resolve) => setTimeout(() => resolve(result), ms));

export const generateId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

export const sumFilled = (roles = []) =>
  roles.reduce((total, role) => total + Number(role.filledCount || 0), 0);

export const getRoleById = (roles = [], roleId) =>
  roles.find((role) => role.id === roleId) ?? null;
