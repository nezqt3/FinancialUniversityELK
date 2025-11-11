import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  parseIdSchedule,
  parseSchedule,
} from "../../methods/parse/parseSchedule";

const STORAGE_KEY = "max-miniapp:schedule-profile";
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const WEEKDAY_SHORT_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
});
const WEEKDAY_LONG_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
});
const WEEKDAY_FULL_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const toISODate = (date) => {
  if (!(date instanceof Date)) {
    return "";
  }
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  const localTime = date.getTime() - tzOffsetMs;
  return new Date(localTime).toISOString().split("T")[0];
};

const buildWeekDays = (offset = 0) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const diffToMonday = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(monday.getDate() - diffToMonday + offset * 7);

  const todayIsoString = toISODate(new Date());

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const iso = toISODate(current);

    return {
      iso,
      labelShort: WEEKDAY_SHORT_FORMAT.format(current).replace(".", ""),
      labelLong: WEEKDAY_LONG_FORMAT.format(current),
      dayNumber: current.getDate(),
      monthNumber: current.getMonth(),
      fullLabel: WEEKDAY_FULL_FORMAT.format(current),
      isToday: iso === todayIsoString,
    };
  });
};

const formatWeekRange = (days) => {
  if (!days?.length) {
    return "";
  }

  const firstDate = new Date(days[0].iso);
  const lastDate = new Date(days[days.length - 1].iso);
  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();
  const firstMonth = MONTHS_GENITIVE[firstDate.getMonth()];
  const lastMonth = MONTHS_GENITIVE[lastDate.getMonth()];

  if (firstDate.getMonth() === lastDate.getMonth()) {
    return `${firstDay}–${lastDay} ${firstMonth}`;
  }

  return `${firstDay} ${firstMonth} — ${lastDay} ${lastMonth}`;
};

const formatKindLabel = (kind) => {
  const normalized = (kind ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (/лекц/i.test(normalized)) {
    return "Лекция";
  }
  if (/(практ|семинар)/i.test(normalized)) {
    return "Семинар";
  }
  return normalized;
};

const getCommonStreamLabel = (labels = []) => {
  const clean = labels
    .map((label) => (label ?? "").trim())
    .filter(Boolean);
  if (clean.length < 2) {
    return null;
  }
  const sorted = [...clean].sort((a, b) => a.localeCompare(b, "ru"));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let index = 0;
  while (index < first.length && first[index] === last[index]) {
    index += 1;
  }
  const prefix = first.slice(0, index).trim().replace(/[-_.:/\\]+$/, "");
  if (prefix.length < 3) {
    return null;
  }
  return prefix;
};

const splitLabels = (labels = []) =>
  labels
    .flatMap((label) =>
      (label ?? "")
        .split(/[,;•]/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .filter(Boolean);

const buildStreamDisplay = (streamLabels = [], groupLabels = []) => {
  const expandedStreams = splitLabels(streamLabels);
  const expandedGroups = splitLabels(groupLabels);
  const primary = expandedStreams.length > 0 ? expandedStreams : expandedGroups;
  if (primary.length <= 1) {
    return [];
  }
  const common = getCommonStreamLabel(primary);
  if (common) {
    return [common];
  }
  return primary;
};

const formatCountdownLabel = (msDiff) => {
  if (!Number.isFinite(msDiff) || msDiff <= 0) {
    return "";
  }
  const totalMinutes = Math.max(Math.round(msDiff / 60000), 1);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) {
    return `Через ${hours}ч ${minutes}м`;
  }
  if (hours) {
    return `Через ${hours}ч`;
  }
  return `Через ${minutes}м`;
};

const uniqueValues = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => (value ?? "").toString().trim())
    .filter((value) => value && value.toLowerCase() !== "none")
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
};

const parseLessonDate = (iso, time) => {
  if (!iso || !time) {
    return null;
  }
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const date = new Date(`${iso}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const normalizeLesson = (lesson, iso, index) => {
  const uniqueDisciplines = uniqueValues(lesson.disciplines);
  const uniqueKinds = uniqueValues(lesson.kindOfWorks);
  const lecturers = uniqueValues(lesson.lecturers);
  const lecturerTitles = uniqueValues(lesson.lecturerTitles);
  const rooms = uniqueValues(lesson.auditoriums);
  const streamLabels = uniqueValues(lesson.streams);
  const groupLabels = uniqueValues(lesson.groups);
  const urls = (lesson.urls || []).filter(
    (link) => link?.url && link.url !== "none",
  );

  const startDate = parseLessonDate(iso, lesson.beginLesson);
  const endDate = parseLessonDate(iso, lesson.endLesson);
  const now = new Date();
  const isCurrent =
    startDate && endDate && now >= startDate && now <= endDate ? true : false;
  const isPast = endDate ? now > endDate : false;
  const startTimestamp = startDate?.getTime() ?? null;

  return {
    id: `${iso}-${lesson.beginLesson}-${lesson.endLesson}-${index}`,
    beginLesson: lesson.beginLesson,
    endLesson: lesson.endLesson,
    title: uniqueDisciplines[0] || "Неизвестный предмет",
    extraDisciplines: uniqueDisciplines.slice(1),
    kindOfWork: formatKindLabel(uniqueKinds[0]),
    lecturers,
    lecturerTitles,
    rooms,
    groups: groupLabels,
    streams: buildStreamDisplay(streamLabels, groupLabels),
    urls,
    isCurrent,
    isPast,
    countdownLabel: "",
    startTimestamp,
    iso,
  };
};

const LessonCard = ({ lesson, index }) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -18 }}
    transition={{
      duration: 0.35,
      delay: index * 0.05,
      ease: [0.16, 1, 0.3, 1],
    }}
    className={[
      "schedule-lesson-card",
      lesson.isCurrent ? "schedule-lesson-card--current" : "",
      !lesson.isCurrent && lesson.isPast ? "schedule-lesson-card--past" : "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <div className="schedule-lesson-card__header">
      <div className="schedule-lesson-card__time">
        <span>{lesson.beginLesson}</span>
        <span>—</span>
        <span>{lesson.endLesson}</span>
      </div>
      <div className="schedule-lesson-card__tags">
        <div className="schedule-lesson-card__tag-row">
          {lesson.kindOfWork && (
            <span className="schedule-chip schedule-chip--kind">
              {lesson.kindOfWork}
            </span>
          )}
        </div>
        <div className="schedule-lesson-card__tag-row">
          {lesson.isCurrent && (
            <span className="schedule-chip schedule-chip--now">
              Идёт сейчас
            </span>
          )}
          {!lesson.isCurrent && lesson.countdownLabel && (
            <span className="schedule-chip schedule-chip--countdown">
              {lesson.countdownLabel}
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="schedule-lesson-card__body">
      <h3 className="schedule-lesson-card__title">{lesson.title}</h3>
      {lesson.extraDisciplines.length > 0 && (
        <p className="schedule-lesson-card__subtitle">
          {lesson.extraDisciplines.join(", ")}
        </p>
      )}
      {lesson.lecturers.length > 0 && (
        <div className="schedule-lesson-card__row">
          <p className="schedule-lesson-card__label">Преподаватель</p>
          <p className="schedule-lesson-card__value">
            {lesson.lecturers.join(", ") ||
              lesson.lecturerTitles.join(", ") ||
              "Не указан"}
          </p>
        </div>
      )}
      {lesson.rooms.length > 0 && (
        <div className="schedule-lesson-card__row">
          <p className="schedule-lesson-card__label">Аудитория</p>
          <p className="schedule-lesson-card__value">
            {lesson.rooms.join(", ")}
          </p>
        </div>
      )}
      {lesson.groups.length > 0 && (
        <div className="schedule-lesson-card__row">
          <p className="schedule-lesson-card__label">Группы</p>
          <p className="schedule-lesson-card__value">
            {lesson.groups.join(", ")}
          </p>
        </div>
      )}
      {lesson.streams.length > 0 && (
        <div className="schedule-lesson-card__row">
          <p className="schedule-lesson-card__label">Поток</p>
          <p className="schedule-lesson-card__value">
            {lesson.streams.join(", ")}
          </p>
        </div>
      )}
      {lesson.urls.length > 0 && (
        <div className="schedule-lesson-card__links">
          {lesson.urls.map((link, linkIndex) => (
            <a
              key={`${lesson.id}-link-${linkIndex}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.description && link.description !== "none"
                ? link.description
                : "Ссылка"}
            </a>
          ))}
        </div>
      )}
    </div>
  </motion.article>
);

const EmptyState = ({ title, subtitle }) => (
  <motion.div
    layout
    className="schedule-empty"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.3 }}
  >
    <p className="schedule-empty__title">{title}</p>
    <p className="schedule-empty__subtitle">{subtitle}</p>
  </motion.div>
);

const ScheduleScreen = () => {
  const todayWeek = useMemo(() => buildWeekDays(0), []);
  const todayIso = useMemo(() => toISODate(new Date()), []);
  const initialIndex = useMemo(() => {
    const idx = todayWeek.findIndex((day) => day.iso === todayIso);
    return idx === -1 ? 0 : idx;
  }, [todayWeek, todayIso]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex);
  const weekDays = useMemo(() => buildWeekDays(weekOffset), [weekOffset]);

  useEffect(() => {
    setSelectedDayIndex((prev) =>
      Math.min(Math.max(prev, 0), weekDays.length - 1),
    );
  }, [weekDays]);

  const activeDay = weekDays[selectedDayIndex] ?? weekDays[0];
  const activeIso = activeDay?.iso;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [lessonsCache, setLessonsCache] = useState({});
  const searchInputRef = useRef(null);
  const isSearchBusy = isSuggesting || isSubmittingSearch;
  const shouldExpandSearch =
    isEditingProfile ||
    isSearchFocused ||
    Boolean(searchQuery.trim()) ||
    searchResults.length > 0;

  const [selectedProfile, setSelectedProfile] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!selectedProfile) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProfile));
  }, [selectedProfile]);

  useEffect(() => {
    if (isEditingProfile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isEditingProfile]);

  useEffect(() => {
    if (!selectedProfile) {
      setIsEditingProfile(false);
    }
  }, [selectedProfile]);

  useEffect(() => {
    const query = searchQuery.trim();
    setSearchError("");
    if (query.length < 3) {
      setSearchResults([]);
      setIsSuggesting(false);
      return;
    }
    if (selectedProfile && !isEditingProfile) {
      setSearchResults([]);
      setIsSuggesting(false);
      return;
    }

    let aborted = false;
    const debounceId = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const results = await parseIdSchedule(query);
        if (aborted) {
          return;
        }
        setSearchResults(results.slice(0, 6));
      } catch (error) {
        if (!aborted) {
          console.error("Schedule suggestion search failed", error);
          setSearchError("Ошибка при поиске расписания");
        }
      } finally {
        if (!aborted) {
          setIsSuggesting(false);
        }
      }
    }, 250);

    return () => {
      aborted = true;
      clearTimeout(debounceId);
    };
  }, [isEditingProfile, searchQuery, selectedProfile]);

  const cacheKey =
    selectedProfile && activeIso
      ? `${selectedProfile.id}:${selectedProfile.type}:${activeIso}`
      : null;

  const cacheEntry = cacheKey ? lessonsCache[cacheKey] : undefined;

  useEffect(() => {
    if (!selectedProfile || !activeIso || !cacheKey) {
      return;
    }
    if (cacheEntry?.status === "ready" || cacheEntry?.status === "loading") {
      return;
    }

    let aborted = false;
    setLessonsCache((prev) => ({
      ...prev,
      [cacheKey]: { status: "loading", data: prev[cacheKey]?.data ?? [] },
    }));

    const load = async () => {
      try {
        const lessonsData = await parseSchedule(
          selectedProfile.id,
          selectedProfile.type,
          activeIso,
          activeIso,
        );

        if (aborted) {
          return;
        }

        if (!Array.isArray(lessonsData)) {
          throw new Error("Неверный ответ от сервиса расписания");
        }

        const normalized = lessonsData
          .map((lesson, index) => normalizeLesson(lesson, activeIso, index))
          .sort(
            (a, b) =>
              (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0),
          );

        const nowTs = Date.now();
        const upcomingIndex = normalized.findIndex(
          (lesson) =>
            !lesson.isCurrent &&
            Number.isFinite(lesson.startTimestamp) &&
            lesson.startTimestamp > nowTs,
        );

        const enhanced =
          upcomingIndex === -1
            ? normalized
            : normalized.map((lesson, index) =>
                index === upcomingIndex
                  ? {
                      ...lesson,
                      countdownLabel: formatCountdownLabel(
                        lesson.startTimestamp - nowTs,
                      ),
                    }
                  : lesson,
              );

        const sanitized = enhanced.map(({ startTimestamp, ...rest }) => rest);

        setLessonsCache((prev) => ({
          ...prev,
          [cacheKey]: { status: "ready", data: sanitized },
        }));
      } catch (error) {
        console.error("Schedule request failed", error);
        if (!aborted) {
          setLessonsCache((prev) => ({
            ...prev,
            [cacheKey]: { status: "error", error },
          }));
        }
      }
    };

    load();

    return () => {
      aborted = true;
    };
  }, [cacheKey, selectedProfile?.id, selectedProfile?.type, activeIso]);

  const handleSelectProfile = useCallback((profile) => {
    setSelectedProfile(profile);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setIsSearchFocused(false);
    setIsSuggesting(false);
    setIsSubmittingSearch(false);
    setIsEditingProfile(false);
    setLessonsCache({});
  }, []);

  const handleSearch = useCallback(
    async (event) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (selectedProfile && !isEditingProfile) {
        return;
      }
      if (query.length < 3) {
        setSearchError("Введите минимум 3 символа");
        return;
      }

      try {
        setIsSubmittingSearch(true);
        setSearchError("");
        const results = await parseIdSchedule(query);
        setSearchResults(results.slice(0, 6));
        if (!results.length) {
          setSearchError("Ничего не найдено");
          return;
        }

        const exactMatch =
          results.find(
            (result) => result.label.toLowerCase() === query.toLowerCase(),
          ) || results[0];

        handleSelectProfile(exactMatch);
      } catch (error) {
        console.error("Schedule search failed", error);
        setSearchError("Ошибка при поиске расписания");
      } finally {
        setIsSubmittingSearch(false);
      }
    },
    [handleSelectProfile, isEditingProfile, searchQuery, selectedProfile],
  );
  const handleEnterEditMode = useCallback(() => {
    setIsEditingProfile(true);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setIsSearchFocused(false);
  }, []);

  const handleWeekChange = useCallback((step) => {
    setWeekOffset((prev) => prev + step);
  }, []);

  const hasProfile = Boolean(selectedProfile);
  const isLoadingLessons = cacheEntry?.status === "loading";
  const lessons = cacheEntry?.data ?? [];

  return (
    <section className="screen schedule-screen">
      <div className="schedule-screen__search-block">
        <AnimatePresence mode="wait">
          {selectedProfile && !isEditingProfile ? (
            <motion.button
              key="schedule-search-pill"
              type="button"
              className="schedule-search-pill"
              onClick={handleEnterEditMode}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>{selectedProfile.label}</span>
              <small>{selectedProfile.type}</small>
            </motion.button>
          ) : (
            <motion.div
              key="schedule-search-form"
              className={[
                "schedule-search__wrapper",
                shouldExpandSearch ? "schedule-search__wrapper--expanded" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <form className="schedule-search" onSubmit={handleSearch}>
                <div className="schedule-search__field">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Поиск расписания"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {isSearchBusy && (
                    <span className="schedule-search__spinner" />
                  )}
                </div>
                <motion.button
                  type="submit"
                  className="schedule-search__submit"
                  whileTap={{ scale: 0.9 }}
                  disabled={isSearchBusy}
                  aria-label="Найти расписание"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="15.5"
                      y1="15.5"
                      x2="21"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.button>
              </form>

              {searchError && (
                <p className="schedule-search__error">{searchError}</p>
              )}

              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.ul
                    className="schedule-search__results"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          type="button"
                          onClick={() => handleSelectProfile(result)}
                        >
                          <span>{result.label}</span>
                          <small>{result.type}</small>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="schedule-screen__heading">
        <div>
          <h2 className="screen__title">Расписание</h2>
          {!selectedProfile && (
            <p className="screen__subtitle">
              Найдите свою группу или преподавателя, чтобы увидеть расписание.
            </p>
          )}
        </div>
      </div>

      <motion.div
        className="schedule-week"
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <button type="button" onClick={() => handleWeekChange(-1)}>
          ←
        </button>
        <div>
          <p>{formatWeekRange(weekDays)}</p>
          <span>
            {weekOffset === 0 ? "Текущая неделя" : `Смещение: ${weekOffset}`}
          </span>
        </div>
        <button type="button" onClick={() => handleWeekChange(1)}>
          →
        </button>
      </motion.div>

      <div className="schedule-days">
        {weekDays.map((day, index) => {
          const isActive = index === selectedDayIndex;
          return (
            <motion.button
              key={day.iso}
              type="button"
              className={[
                "schedule-day-chip",
                isActive ? "schedule-day-chip--active" : "",
                day.isToday ? "schedule-day-chip--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDayIndex(index)}
              layout
              whileTap={{ scale: 0.95 }}
            >
              <span>{day.labelShort}</span>
              <strong>{day.dayNumber}</strong>
            </motion.button>
          );
        })}
      </div>

      <div className="schedule-lessons">
        {!hasProfile && (
          <EmptyState
            title="Профиль не выбран"
            subtitle="Введите имя группы или преподавателя, чтобы увидеть расписание."
          />
        )}

        {hasProfile && cacheEntry?.status === "error" && (
          <EmptyState
            title="Не удалось загрузить данные"
            subtitle="Попробуйте выбрать другую дату или повторите попытку позже."
          />
        )}

        {hasProfile && isLoadingLessons && (
          <div className="schedule-skeleton">
            {Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="schedule-skeleton__row"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 0.6 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        )}

        {hasProfile &&
          !isLoadingLessons &&
          lessons.length === 0 &&
          cacheEntry?.status === "ready" && (
            <EmptyState
              title="Пар нет"
              subtitle="На выбранный день занятия не запланированы."
            />
          )}

        <AnimatePresence mode="sync">
          {hasProfile &&
            !isLoadingLessons &&
            lessons.map((lesson, index) => (
              <LessonCard key={lesson.id} lesson={lesson} index={index} />
            ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ScheduleScreen;
