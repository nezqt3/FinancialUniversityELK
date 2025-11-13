import { useState } from "react";
import { useAccount } from "../../context/AccountContext.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ onSwitch }) => {
  const { loginAccount, isProcessing, error } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setSuccessMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setLocalError("Введите корректную почту");
      return;
    }
    if (!password) {
      setLocalError("Введите пароль");
      return;
    }

    try {
      await loginAccount({ email: normalizedEmail, password });
      setSuccessMessage("Готово! Профиль загружен.");
      setEmail("");
      setPassword("");
    } catch (submitError) {
      setLocalError(
        submitError?.message || "Не удалось авторизоваться. Попробуйте позже.",
      );
    }
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <div className="account-form__field">
        <label htmlFor="login-email">Почта</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="student@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isProcessing}
        />
      </div>
      <div className="account-form__field">
        <label htmlFor="login-password">Пароль</label>
        <input
          id="login-password"
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isProcessing}
        />
      </div>

      {(localError || error) && (
        <p className="account-form__error">{localError || error}</p>
      )}
      {successMessage && (
        <p className="account-form__success">{successMessage}</p>
      )}

      <div className="account-form__actions">
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? "Авторизация..." : "Войти"}
        </button>
        <button
          type="button"
          className="account-form__link"
          onClick={onSwitch}
        >
          Нет аккаунта? Зарегистрируйтесь
        </button>
      </div>
    </form>
  );
};

export default LoginScreen;
