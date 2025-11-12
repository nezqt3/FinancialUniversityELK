const UNIVERSITY_ID = "rgeu-university";
const TITLE = "Ростовский государственный экономический университет (РИНХ)";

const getScheduleRgue = async (group) => {
  const response = await fetch(
    `https://rasp-api.rsue.ru/api/v1/schedule/lessons/${group}/`
  );
};

const getNewsRgue = async () => {
  const baseUrl = "https://rsue.ru";
  const response = await fetch(`${baseUrl}/universitet/novosti/`);
  if (!response.ok) throw new Error("Не удалось получить страницу новостей");

  const html = await response.text();

  const newsBlocks = html.split('<div class="news-item">').slice(1);

  const news = newsBlocks
    .map((block) => {
      const dateMatch = block.match(
        /<div[^>]+id="news-date"[^>]*>\s*([^<]+)\s*<\/div>/
      );
      const date = dateMatch ? dateMatch[1].trim() : null;

      const titleMatch = block.match(
        /<div[^>]+id="news-title"[^>]*>\s*<a href="([^"]+)">([\s\S]*?)<\/a>/
      );
      const url = titleMatch ? baseUrl + titleMatch[1] : null;
      const title = titleMatch
        ? titleMatch[2].replace(/\s+/g, " ").trim()
        : null;

      const imgMatch = block.match(
        /<div[^>]+id="news-image"[^>]*>[\s\S]*?<img src="([^"]+)"/
      );
      const img = imgMatch ? baseUrl + imgMatch[1] : null;

      if (url && title) {
        return { url, title, img, date };
      }
      return null;
    })
    .filter(Boolean);

  return news;
};

const getNewsList = async () => {
  return getNewsRgue();
};

const getSchedule = async (group) => {
  return getScheduleRgue(group);
};

module.exports = {
  id: UNIVERSITY_ID,
  title: TITLE,
  shortTitle: "РГЭУ (РИНХ)",
  domain: "rsue.ru",
  getNewsList,
  getSchedule,
  getCalendar: async () => [],
  getDeanOfficeBids: async () => [],
  getLibraryResources: async () => [],
};
