import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAccount } from "../../context/AccountContext.jsx";
import SettingsIcon from "../../static/settings.svg";
import AccountProfileCard from "../account/AccountProfileCard.jsx";
import LoginScreen from "../account/LoginScreen.jsx";
import RegistrationScreen from "../account/RegistrationScreen.jsx";

const SKELETON_ITEMS = Array.from({ length: 1 }, (_, i) => i);

const AccountScreen = ({ onNavigate }) => {
  const { account, isInitializing, logout } = useAccount();
  const [authMode, setAuthMode] = useState("login");

  const handleOpenSettings = () => {
    onNavigate?.("settings");
  };

  const renderSkeleton = () => (
    <div className="account-skeleton">
      {SKELETON_ITEMS.map((_, index) => (
        <motion.div
          key={index}
          className="account-skeleton__item"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="account-skeleton__avatar" />
          <div className="account-skeleton__line" />
        </motion.div>
      ))}
    </div>
  );

  const renderAuth = () => (
    <div className="account-auth">
      <div className="account-auth__body">
        {authMode === "login" ? (
          <LoginScreen onSwitch={() => setAuthMode("register")} />
        ) : (
          <RegistrationScreen onSwitch={() => setAuthMode("login")} />
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isInitializing) {
      return renderSkeleton();
    }
    if (account) {
      return (
        <AccountProfileCard account={account} onLogout={logout} />
      );
    }
    return renderAuth();
  };

  return (
    <section className="screen account-screen">
      <header className="account-screen__header">
        <div className="account-screen__header-content">
          <p className="account-screen__eyebrow">
            {account ? "Профиль" : "Создайте аккаунт"}
          </p>
          <h2 className="account-screen__title">
            {account ? "Ваши данные" : "Личный кабинет"}
          </h2>
          <p className="account-screen__subtitle">
            {account
              ? "Здесь хранится краткая информация о вашем аккаунте."
              : "Сохраните ФИО, вуз и группу, чтобы быстрее пользоваться сервисами."}
          </p>
        </div>
        <button
          type="button"
          className="account-screen__settings-button"
          onClick={handleOpenSettings}
          aria-label="Открыть настройки"
        >
          <img src={SettingsIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={account ? "account-view" : isInitializing ? "loading" : authMode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default AccountScreen;
