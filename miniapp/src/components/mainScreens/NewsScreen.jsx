import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getNews, getNewsContent } from "../../methods/parse/parseNews";
import {
  newsDetailMotion,
  newsOverviewMotion,
  newsTapFeedback,
} from "../../animations/NewsAnim";

// Время жизни кэша (в миллисекундах)
const CACHE_LIFETIME = 1000 * 60 * 60; // 1 час

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNews, setActiveNews] = useState(null);
  const [newsContent, setNewsContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // --- Проверяем кэш ---
        const cached = localStorage.getItem("newsData");
        const cachedTime = localStorage.getItem("newsDataTime");
        const now = Date.now();

        if (cached && cachedTime && now - cachedTime < CACHE_LIFETIME) {
          // Используем кэшированные данные
          const parsedNews = JSON.parse(cached);
          setNews(parsedNews);
          setLoading(false);
          return;
        }

        // --- Если нет кэша или устарел — грузим заново ---
        const newNews = await getNews();
        setNews(newNews || []);

        // --- Сохраняем в кэш ---
        localStorage.setItem("newsData", JSON.stringify(newNews));
        localStorage.setItem("newsDataTime", now.toString());
      } catch (error) {
        console.error("Ошибка при загрузке новостей:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const openNews = async (item) => {
    setActiveNews(item);
    setContentLoading(true);

    // --- Проверяем, есть ли кэш для конкретной новости ---
    const cachedContent = localStorage.getItem(`newsContent_${item.url}`);
    if (cachedContent) {
      setNewsContent(cachedContent);
      setContentLoading(false);
      return;
    }

    const content = await getNewsContent(item.url);
    const finalText = content || "Не удалось загрузить содержимое новости 😢";

    setNewsContent(finalText);
    setContentLoading(false);

    // --- Сохраняем контент новости в кэш ---
    localStorage.setItem(`newsContent_${item.url}`, finalText);
  };

  const backToList = () => {
    setActiveNews(null);
    setNewsContent("");
  };

  return (
    <section
      className={`screen news-screen${activeNews ? " news-screen--detail" : ""}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {activeNews ? (
          <motion.div
            key="news-detail"
            className="news-detail"
            initial={newsDetailMotion.initial}
            animate={newsDetailMotion.animate}
            exit={newsDetailMotion.exit}
            transition={newsDetailMotion.transition}
          >
            <motion.button
              type="button"
              className="news-detail__back"
              onClick={backToList}
              whileTap={newsTapFeedback}
            >
              <span aria-hidden="true">←</span>
              Назад к новостям
            </motion.button>

            <div className="news-detail__header">
              <h2 className="screen__title">{activeNews.title}</h2>
              <img
                src={activeNews.img}
                alt=""
                className="news-detail__image"
                loading="lazy"
              />
            </div>

            <motion.div
              className="news-detail__content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {contentLoading ? (
                <p>Загрузка содержимого...</p>
              ) : (
                <p className="news-detail__text">{newsContent}</p>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="news-overview"
            className="news-overview"
            initial={newsOverviewMotion.initial}
            animate={newsOverviewMotion.animate}
            exit={newsOverviewMotion.exit}
            transition={newsOverviewMotion.transition}
          >
            <h2 className="screen__title">Новости</h2>
            <p className="screen__subtitle">
              Узнайте актуальную информацию о вашем университете
            </p>

            {loading && <p>Загрузка...</p>}

            {!loading && news.length === 0 && (
              <p className="screen__subtitle">Нет новостей 😢</p>
            )}

            {!loading && (
              <div className="news-grid">
                {news.map((elem, index) => (
                  <motion.article
                    key={index}
                    className="news-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={newsTapFeedback}
                    onClick={() => openNews(elem)}
                  >
                    <div className="news-card__content">
                      <h3 className="news-card__title">{elem.title}</h3>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
