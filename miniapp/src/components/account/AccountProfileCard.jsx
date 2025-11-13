import { motion } from "motion/react";

const getInitials = (fullName) => {
  if (!fullName) {
    return "??";
  }
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const AccountProfileCard = ({ account, onLogout }) => {
  if (!account) {
    return null;
  }

  return (
    <motion.div
      className="account-card account-card--profile"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="account-card__avatar account-card__avatar--initials">
        {getInitials(account.fullName)}
      </div>

      <div className="account-card__info">
        <span className="account-card__info-name">{account.fullName}</span>
        <span className="account-card__info-email">{account.email}</span>
        <div className="account-card__tags">
          <span>{account.universityTitle}</span>
          <span>{account.course} курс</span>
          <span>{account.groupLabel}</span>
        </div>
        {account.scheduleProfile && (
          <span className="account-card__badge">
            Синхронизация с расписанием
          </span>
        )}
      </div>

      <div className="account-card__actions">
        <button
          type="button"
          className="account-card__action"
          onClick={onLogout}
        >
          Выйти
        </button>
      </div>
    </motion.div>
  );
};

export default AccountProfileCard;
