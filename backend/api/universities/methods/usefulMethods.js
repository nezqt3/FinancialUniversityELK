const dayMap = {
  Понедельник: 1,
  Вторник: 2,
  Среда: 3,
  Четверг: 4,
  Пятница: 5,
  Суббота: 6,
  Воскресенье: 7,
};

const sanitizeText = (value) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const fetchText = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
};

const ensureAbsoluteUrl = (url, base = "https://www.fa.ru") => {
  if (!url) {
    return "";
  }
  if (/^https?:/i.test(url)) {
    return url;
  }
  return `${base}${url}`;
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

function parseDMY(dateStr) {
  if (dateStr === null) return undefined;
  const [day, month, year] = dateStr.split(".");
  return new Date(`${year}-${month}-${day}`);
}

function convertNameOfDay(dayName) {
  return dayMap[dayName] ?? null;
}

module.exports = {
  fetchJson,
  fetchText,
  convertNameOfDay,
  sanitizeText,
  parseDMY,
  ensureAbsoluteUrl,
};
