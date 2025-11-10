import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import StartScreen from "./components/StartScreen";
import MenuBar, { MENU_ITEMS } from "./components/MenuBar";
import ScheduleScreen from "./components/screens/ScheduleScreen";
import ServicesScreen from "./components/screens/ServicesScreen";
import NewsScreen from "./components/screens/NewsScreen";
import ProjectsScreen from "./components/screens/ProjectsScreen";
import AccountScreen from "./components/screens/AccountScreen";
import "./styles/main.scss";

const SCREEN_COMPONENTS = {
  schedule: ScheduleScreen,
  services: ServicesScreen,
  news: NewsScreen,
  projects: ProjectsScreen,
  account: AccountScreen,
};

const SCREEN_KEYS = MENU_ITEMS.map(({ key }) => key);
const SWIPE_THRESHOLD = 60;

const SCREEN_VARIANTS = {
  enter: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? 96 : -96,
    opacity: direction === 0 ? 1 : 0,
    scale: direction === 0 ? 1 : 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? -96 : 96,
    opacity: 0,
    scale: 0.98,
  }),
};

const SCREEN_TRANSITION = {
  x: { type: "spring", stiffness: 420, damping: 40 },
  opacity: { duration: 0.2, ease: "easeOut" },
};

const App = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [activeScreen, setActiveScreen] = useState(MENU_ITEMS[0].key);
  const [direction, setDirection] = useState(0);
  const swipeSessionRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
  });

  const ActiveScreen = SCREEN_COMPONENTS[activeScreen] ?? ScheduleScreen;
  const activeIndex = Math.max(SCREEN_KEYS.indexOf(activeScreen), 0);

  const handleScreenChange = useCallback(
    (nextKey) => {
      if (!nextKey || nextKey === activeScreen) {
        return;
      }

      const nextIndex = SCREEN_KEYS.indexOf(nextKey);

      if (nextIndex === -1) {
        return;
      }

      setDirection(nextIndex > activeIndex ? 1 : -1);
      setActiveScreen(nextKey);
    },
    [activeIndex, activeScreen],
  );

  const goToNeighbor = useCallback(
    (step) => {
      const targetIndex = activeIndex + step;
      const nextKey = SCREEN_KEYS[targetIndex];

      if (!nextKey) {
        return;
      }

      setDirection(step > 0 ? 1 : -1);
      setActiveScreen(nextKey);
    },
    [activeIndex],
  );

  const handlePointerDown = useCallback((event) => {
    if (
      swipeSessionRef.current.pointerId !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    swipeSessionRef.current.pointerId = event.pointerId;
    swipeSessionRef.current.startX = event.clientX;
    swipeSessionRef.current.startY = event.clientY;
  }, []);

  const clearSwipeSession = useCallback(() => {
    swipeSessionRef.current.pointerId = null;
    swipeSessionRef.current.startX = 0;
    swipeSessionRef.current.startY = 0;
  }, []);

  const handleSwipeEnd = useCallback(
    (event) => {
      if (swipeSessionRef.current.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - swipeSessionRef.current.startX;
      const deltaY = event.clientY - swipeSessionRef.current.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        goToNeighbor(deltaX < 0 ? 1 : -1);
      }

      clearSwipeSession();
    },
    [clearSwipeSession, goToNeighbor],
  );

  const handleSwipeCancel = useCallback(
    (event) => {
      if (swipeSessionRef.current.pointerId !== event.pointerId) {
        return;
      }

      clearSwipeSession();
    },
    [clearSwipeSession],
  );

  useEffect(() => {
    if (!isStarted || typeof window === "undefined") {
      return undefined;
    }

    window.addEventListener("pointerup", handleSwipeEnd);
    window.addEventListener("pointercancel", handleSwipeCancel);

    return () => {
      window.removeEventListener("pointerup", handleSwipeEnd);
      window.removeEventListener("pointercancel", handleSwipeCancel);
    };
  }, [handleSwipeCancel, handleSwipeEnd, isStarted]);

  if (!isStarted) {
    return <StartScreen onContinue={() => setIsStarted(true)} />;
  }

  return (
    <div className="app-shell">
      <main
        className="app-shell__content"
        onPointerDown={handlePointerDown}
      >
        <div className="screen-stack">
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={activeScreen}
              className="screen-stack__item"
              custom={direction}
              variants={SCREEN_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SCREEN_TRANSITION}
            >
              <ActiveScreen />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <MenuBar activeItem={activeScreen} onChange={handleScreenChange} />
    </div>
  );
};

export default App;
