export const getLessonCardMotion = (index = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: {
    duration: 0.35,
    delay: index * 0.05,
    ease: [0.16, 1, 0.3, 1],
  },
});

export const emptyStateMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.3 },
};

export const scheduleWeekMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

export const searchPillMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
  whileTap: { scale: 0.96 },
};

export const searchFormMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};

export const searchResultsMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};

export const searchSubmitTap = { scale: 0.9 };
export const dayButtonTap = { scale: 0.95 };

export const skeletonRowAnimation = {
  initial: { opacity: 0.2 },
  animate: { opacity: 0.6 },
  transition: {
    duration: 0.8,
    repeat: Infinity,
    repeatType: "reverse",
  },
};
