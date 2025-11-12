export async function getBids() {
  try {
    const res = await fetch(`http://localhost:4000/api/links`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const articles = doc.querySelectorAll("article.page-card-link.app-card");

    const bids = [];

    articles.forEach((article) => {
      const title = article
        .querySelector("h4.page-card-link__title")
        ?.textContent.trim();

      const url = article
        .querySelector("a.ui-icon-button._primary")
        ?.getAttribute("href");

      if (title && url) {
        bids.push({ title, url });
      }
    });

    return bids;
  } catch (err) {
    console.error("Ошибка запроса или парсинга:", err);
    return [];
  }
}
