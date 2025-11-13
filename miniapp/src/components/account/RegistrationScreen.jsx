import { useEffect, useMemo, useState } from "react";
import { useAccount } from "../../context/AccountContext.jsx";
import { useUniversity } from "../../context/UniversityContext.jsx";
import { parseIdSchedule } from "../../methods/parse/parseSchedule";
import {
  getScheduleStorageKey,
  persistScheduleProfile,
  readStoredScheduleProfile,
  SCHEDULE_PROFILE_EVENT,
} from "../../methods/schedule/scheduleUtils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_QUERY_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

const RegistrationScreen = ({ onSwitch }) => {
  const { registerAccount, isProcessing, error } = useAccount();
  const { university } = useUniversity();
  const universityId = university?.apiId || university?.id || null;
  const universityTitle = university?.title || "Вуз не выбран";
  const storageKey = useMemo(
    () => getScheduleStorageKey(universityId),
    [universityId],
  );
  const initialProfile = useMemo(
    () => readStoredScheduleProfile(storageKey),
    [storageKey],
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [manualGroup, setManualGroup] = useState("");
  const [groupMode, setGroupMode] = useState(
    initialProfile ? "schedule" : "manual",
  );
  const [selectedProfile, setSelectedProfile] = useState(initialProfile);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupResults, setGroupResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setSelectedProfile(initialProfile);
    setGroupMode(initialProfile ? "schedule" : "manual");
  }, [initialProfile]);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) {
      return undefined;
    }
    const handler = (event) => {
      const detail = event.detail ?? {};
      if (detail.storageKey !== storageKey) {
        return;
      }
      setSelectedProfile(detail.profile || null);
      if (detail.profile && groupMode !== "manual") {
        setGroupMode("schedule");
      }
    };
    window.addEventListener(SCHEDULE_PROFILE_EVENT, handler);
    return () => window.removeEventListener(SCHEDULE_PROFILE_EVENT, handler);
  }, [groupMode, storageKey]);

  useEffect(() => {
    if (groupMode !== "manual") {
      setGroupResults([]);
      setSearchError("");
      setIsSearching(false);
      setGroupSearch("");
      return undefined;
    }
    if (typeof window === "undefined") {
      return undefined;
    }
    if (!universityId) {
      setSearchError("Выберите вуз, чтобы искать группу");
      setGroupResults([]);
      setIsSearching(false);
      return undefined;
    }

    const query = groupSearch.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setGroupResults([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    let aborted = false;
    setIsSearching(true);
    const debounceId = window.setTimeout(async () => {
      try {
        const results = await parseIdSchedule(query, universityId);
        if (aborted) {
          return;
        }
        setGroupResults(results.slice(0, 6));
        setSearchError(results.length ? "" : "Ничего не найдено");
      } catch (searchException) {
        console.error("schedule search failed", searchException);
        if (!aborted) {
          setSearchError("Ошибка при поиске группы");
        }
      } finally {
        if (!aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      aborted = true;
      window.clearTimeout(debounceId);
    };
  }, [groupMode, groupSearch, universityId]);

  const handleSelectResult = (result) => {
    if (!result) {
      return;
    }
    if (groupMode === "schedule") {
      setSelectedProfile(result);
      setManualGroup("");
      setGroupSearch("");
      if (storageKey) {
        persistScheduleProfile(storageKey, result);
      }
    } else {
      setManualGroup(result.label);
      setGroupSearch(result.label);
      setSelectedProfile(null);
    }
    setGroupResults([]);
  };

  const handleClearScheduleSync = () => {
    setSelectedProfile(null);
    if (storageKey) {
      persistScheduleProfile(storageKey, null);
    }
    setGroupMode("manual");
  };

  const handleManualInputChange = (value) => {
    setGroupSearch(value);
    setManualGroup(value);
    if (!value) {
      setGroupResults([]);
      setSearchError("");
    }
  };

  const handleClearManualGroup = () => {
    setManualGroup("");
    setGroupSearch("");
    setGroupResults([]);
    setSearchError("");
  };

  useEffect(() => {
    if (groupMode === "manual" && manualGroup && !groupSearch) {
      setGroupSearch(manualGroup);
    }
  }, [groupMode, manualGroup, groupSearch]);

  const normalizeCourse = (value) => {
    const number = Number(String(value).replace(/[^\d]/g, ""));
    if (Number.isNaN(number) || number <= 0) {
      return null;
    }
    return Math.min(Math.max(number, 1), 10);
  };

  const validateForm = () => {
    const errors = {};
    if (!fullName || fullName.trim().split(" ").length < 2) {
      errors.fullName = "Введите ФИО полностью";
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      errors.email = "Некорректная почта";
    }

    const courseNumber = normalizeCourse(course);
    if (!courseNumber) {
      errors.course = "Укажите курс числом (1–10)";
    }

    if (!universityId) {
      errors.university = "Сначала выберите вуз на стартовом экране";
    }

    if (groupMode === "schedule") {
      if (!selectedProfile) {
        errors.group = "Выберите группу из расписания";
      }
    } else if (!manualGroup.trim()) {
      errors.group = "Укажите группу";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Пароли не совпадают";
    }

    setFieldErrors(errors);
    return {
      errors,
      isValid: Object.keys(errors).length === 0,
      courseNumber,
      normalizedEmail,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    const { errors, isValid, courseNumber, normalizedEmail } = validateForm();
    if (!isValid) {
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      course: String(courseNumber),
      groupLabel:
        groupMode === "schedule"
          ? selectedProfile?.label ?? ""
          : manualGroup.trim(),
      universityId,
      universityTitle,
      scheduleProfile:
        groupMode === "schedule" && selectedProfile ? selectedProfile : null,
      password: password,
    };

    try {
      await registerAccount(payload);
      setSuccessMessage("Аккаунт создан. Мы синхронизировали данные.");
      setFieldErrors({});
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      console.error("registration failed", submitError);
      setFieldErrors({
        ...errors,
        submit: submitError?.message || "Не удалось создать аккаунт",
      });
    }
  };

  const renderScheduleSelector = () => (
    <div className="account-group-selector">
      {selectedProfile ? (
        <div className="account-group-selector__pill">
          <div>
            <span>{selectedProfile.label}</span>
            <small>{selectedProfile.type}</small>
          </div>
          <button type="button" onClick={handleClearScheduleSync}>
            Сбросить
          </button>
        </div>
      ) : (
        <p className="account-form__hint">
          Выберите нужную группу через поиск или в блоке «Расписание». После
          выбора она подтянется сюда автоматически.
        </p>
      )}
    </div>
  );

  const renderManualSelector = () => (
    <div className="account-group-selector account-group-selector--manual">
      {manualGroup && (
        <div className="account-group-selector__pill account-group-selector__pill--manual">
          <div>
            <span>{manualGroup}</span>
            <small>Выбранная группа</small>
          </div>
          <button type="button" onClick={handleClearManualGroup}>
            Очистить
          </button>
        </div>
      )}

      <div className="account-form__field">
        <label htmlFor="manual-group-search">Поиск группы</label>
        <div className="account-form__input-with-spinner">
          <input
            id="manual-group-search"
            type="text"
            placeholder={
              universityId ? "Например, БИСО-21-1" : "Сначала выберите вуз"
            }
            value={groupSearch}
            onChange={(event) => handleManualInputChange(event.target.value)}
            disabled={!universityId || isProcessing}
          />
          {isSearching && <span className="account-form__spinner" />}
        </div>
        <p className="account-form__hint">
          Используйте поиск или просто впишите название группы вручную.
        </p>
        {searchError && (
          <p className="account-form__error">{searchError}</p>
        )}
      </div>

      {groupResults.length > 0 && (
        <ul className="account-group-results">
          {groupResults.map((result) => (
            <li key={`${result.type}-${result.id}`}>
              <button type="button" onClick={() => handleSelectResult(result)}>
                <strong>{result.label}</strong>
                <small>{result.type}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <div className="account-form__field">
        <label htmlFor="register-fullName">ФИО</label>
        <input
          id="register-fullName"
          type="text"
          placeholder="Иванов Иван Иванович"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isProcessing}
        />
        {fieldErrors.fullName && (
          <p className="account-form__error">{fieldErrors.fullName}</p>
        )}
      </div>

      <div className="account-form__field">
        <label htmlFor="register-email">Почта</label>
        <input
          id="register-email"
          type="email"
          placeholder="student@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isProcessing}
        />
        {fieldErrors.email && (
          <p className="account-form__error">{fieldErrors.email}</p>
        )}
      </div>

      <div className="account-form__fieldset">
        <div className="account-form__field">
          <label htmlFor="register-university">Вуз</label>
          <input
            id="register-university"
            type="text"
            value={universityTitle}
            readOnly
          />
          {fieldErrors.university && (
            <p className="account-form__error">{fieldErrors.university}</p>
          )}
        </div>

        <div className="account-form__field">
          <label htmlFor="register-course">Курс</label>
          <input
            id="register-course"
            type="number"
            min="1"
            max="10"
            placeholder="1"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            disabled={isProcessing}
          />
          {fieldErrors.course && (
            <p className="account-form__error">{fieldErrors.course}</p>
          )}
        </div>
      </div>

      <div className="account-form__fieldset">
        <div className="account-form__field">
          <label htmlFor="register-password">Пароль</label>
          <input
            id="register-password"
            type="password"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isProcessing}
          />
          {fieldErrors.password && (
            <p className="account-form__error">{fieldErrors.password}</p>
          )}
        </div>
        <div className="account-form__field">
          <label htmlFor="register-password-confirm">Повторите пароль</label>
          <input
            id="register-password-confirm"
            type="password"
            placeholder="Введите пароль ещё раз"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isProcessing}
          />
          {fieldErrors.confirmPassword && (
            <p className="account-form__error">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="account-form__field">
        <label>Группа</label>
        <div className="account-group-mode" data-active={groupMode}>
          <span className="account-group-mode__slider" aria-hidden="true" />
          <button
            type="button"
            className={groupMode === "schedule" ? "is-active" : ""}
            onClick={() => setGroupMode("schedule")}
          >
            Из расписания
          </button>
          <button
            type="button"
            className={groupMode === "manual" ? "is-active" : ""}
            onClick={() => setGroupMode("manual")}
          >
            Вручную
          </button>
        </div>
        {groupMode === "schedule" ? (
          renderScheduleSelector()
        ) : (
          renderManualSelector()
        )}
        {fieldErrors.group && (
          <p className="account-form__error">{fieldErrors.group}</p>
        )}
      </div>

      {(fieldErrors.submit || error) && (
        <p className="account-form__error">
          {fieldErrors.submit || error}
        </p>
      )}
      {successMessage && (
        <p className="account-form__success">{successMessage}</p>
      )}

      <div className="account-form__actions">
        <button type="submit" disabled={isProcessing || !universityId}>
          {isProcessing ? "Создание..." : "Зарегистрироваться"}
        </button>
        <button
          type="button"
          className="account-form__link"
          onClick={onSwitch}
        >
          Уже есть аккаунт? Войти
        </button>
      </div>
    </form>
  );
};

export default RegistrationScreen;
