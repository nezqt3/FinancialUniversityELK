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

module.exports = {
  fetchJson,
  fetchText,
  sanitizeText,
  ensureAbsoluteUrl,
};
