import { useCallback, useEffect, useRef, useState } from "react";
import { useUniversity } from "../../context/UniversityContext.jsx";
import {
  STORAGE_KEY as SCHEDULE_STORAGE_PREFIX,
  getScheduleStorageKey,
} from "../../methods/schedule/scheduleUtils";

const SettingsScreen = ({ onNavigate }) => {
  const { university, clearUniversity } = useUniversity();
  const universityId = university?.apiId || university?.id || null;
  const [statusMessage, setStatusMessage] = useState("");
  const timeoutRef = useRef(null);

  const clearStatusLater = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (typeof window === "undefined") {
      return;
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setStatusMessage("");
    }, 3500);
  }, []);

  const showStatus = useCallback(
    (message) => {
      setStatusMessage(message);
      clearStatusLater();
    },
    [clearStatusLater],
  );

  const collectScheduleKeys = useCallback(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const baseKey = getScheduleStorageKey();
    const scopedKey = getScheduleStorageKey(universityId);
    const keys = new Set([baseKey, scopedKey]);

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(SCHEDULE_STORAGE_PREFIX)) {
        keys.add(key);
      }
    }

    return Array.from(keys).filter(Boolean);
  }, [universityId]);

  const clearSavedProfiles = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const keys = collectScheduleKeys();
    let removed = 0;
    keys.forEach((key) => {
      if (window.localStorage.getItem(key) !== null) {
        removed += 1;
      }
      window.localStorage.removeItem(key);
    });
    return removed > 0;
  }, [collectScheduleKeys]);

  const handleResetGroup = useCallback(() => {
    const hadProfiles = clearSavedProfiles();
    showStatus(
      hadProfiles
        ? "Группа сброшена. Теперь можно выбрать новую в разделе «Расписание»."
        : "Сохранённых профилей расписания не найдено.",
    );
  }, [clearSavedProfiles, showStatus]);

  const handleResetUniversity = useCallback(() => {
    const currentTitle = university?.shortTitle || university?.title;
    const hadProfiles = clearSavedProfiles();
    clearUniversity();
    if (currentTitle) {
      showStatus(
        `Вуз «${currentTitle}» сброшен.${
          hadProfiles ? " Очистили и сохранённые группы." : ""
        }`,
      );
    } else {
      showStatus("Вы ещё не выбирали вуз.");
    }
  }, [clearSavedProfiles, clearUniversity, showStatus, university]);

  const handleBack = useCallback(() => {
    onNavigate?.("account");
  }, [onNavigate]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return (
    <section className="screen settings-screen">
      <header className="settings-screen__header">
        <button
          type="button"
          className="settings-screen__back"
          onClick={handleBack}
        >
          ← Профиль
        </button>
        <div className="settings-screen__titles">
          <p className="settings-screen__eyebrow">Настройки</p>
          <h2 className="settings-screen__title">Управление данными</h2>
          <p className="settings-screen__subtitle">
            Сбрасывайте выбранный вуз и профиль расписания, если хотите начать
            заново.
          </p>
        </div>
      </header>

      <div className="settings-panel">
        <div className="settings-panel__header">
          <h3>Сохранённые данные</h3>
          <p>Выберите действие, которое поможет начать с чистого листа.</p>
        </div>

        <div className="settings-panel__list">
          <article className="settings-card">
            <div className="settings-card__body">
              <p className="settings-card__title">Сбросить группу</p>
              <p className="settings-card__description">
                Очистим выбранный профиль расписания, чтобы можно было выбрать
                новую группу или преподавателя.
              </p>
            </div>
            <button
              type="button"
              className="settings-card__button"
              onClick={handleResetGroup}
            >
              Сбросить
            </button>
          </article>

          <article className="settings-card settings-card--danger">
            <div className="settings-card__body">
              <p className="settings-card__title">Сбросить университет</p>
              <p className="settings-card__description">
                Вернёмся к экрану выбора вуза. Все сохранённые группы тоже будут
                удалены.
              </p>
            </div>
            <button
              type="button"
              className="settings-card__button settings-card__button--danger"
              onClick={handleResetUniversity}
            >
              Сбросить вуз
            </button>
          </article>
        </div>

        {statusMessage && (
          <p className="settings-panel__status" role="status">
            {statusMessage}
          </p>
        )}
      </div>
    </section>
  );
};

export default SettingsScreen;
