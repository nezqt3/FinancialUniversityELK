import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import StartScreen from "./components/StartScreen";
import ChooseUniversity from "./components/ChooseUniversity";
import MenuBar, { MENU_ITEMS } from "./components/MenuBar";
import ScheduleScreen from "./components/mainScreens/ScheduleScreen";
import ServicesScreen from "./components/mainScreens/ServicesScreen";
import NewsScreen from "./components/mainScreens/NewsScreen";
import ProjectsScreen from "./components/mainScreens/ProjectsScreen";
import AccountScreen from "./components/mainScreens/AccountScreen";
import SettingsScreen from "./components/mainScreens/SettingsScreen";
import useSwipeNavigation from "./hooks/useSwipeNavigation";
import "./styles/main.scss";
import { useUniversity } from "./context/UniversityContext.jsx";

const SCREEN_COMPONENTS = {
  schedule: ScheduleScreen,
  services: ServicesScreen,
  news: NewsScreen,
  projects: ProjectsScreen,
  account: AccountScreen,
  settings: SettingsScreen,
};

const EXTRA_SCREENS = ["settings"];
const SCREEN_KEYS = MENU_ITEMS.map(({ key }) => key);
const SWIPE_THRESHOLD = 60;

const FLOW_STAGES = {
  INTRO: "intro",
  UNIVERSITY: "university",
  MAIN: "main",
};

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

const FLOW_VARIANTS = {
  initial: { opacity: 0, y: 32, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -32, scale: 0.96 },
};

const FLOW_TRANSITION = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

const App = () => {
  const { university: selectedUniversity, universities, selectUniversity } =
    useUniversity();
  const [flowStage, setFlowStage] = useState(() =>
    selectedUniversity ? FLOW_STAGES.MAIN : FLOW_STAGES.INTRO,
  );
  const [activeScreen, setActiveScreen] = useState(MENU_ITEMS[0].key);
  const [direction, setDirection] = useState(0);

  const getNavigationIndex = useCallback((key) => {
    if (key === "settings") {
      return SCREEN_KEYS.indexOf("account");
    }
    return SCREEN_KEYS.indexOf(key);
  }, []);

  const ActiveScreen = SCREEN_COMPONENTS[activeScreen] ?? ScheduleScreen;
  const activeIndex = Math.max(getNavigationIndex(activeScreen), 0);
  const menuActiveItem = activeScreen === "settings" ? "account" : activeScreen;

  useEffect(() => {
    if (selectedUniversity && flowStage !== FLOW_STAGES.MAIN) {
      setFlowStage(FLOW_STAGES.MAIN);
      return;
    }

    if (!selectedUniversity && flowStage === FLOW_STAGES.MAIN) {
      setFlowStage(FLOW_STAGES.UNIVERSITY);
    }
  }, [flowStage, selectedUniversity]);

  const handleScreenChange = useCallback(
    (nextKey) => {
      if (!nextKey || nextKey === activeScreen) {
        return;
      }

      const nextIndex = getNavigationIndex(nextKey);
      const currentIndex = getNavigationIndex(activeScreen);

      if (nextIndex === -1 && nextKey !== "settings") {
        return;
      }

      const isSettingsTransition =
        nextKey === "settings" || activeScreen === "settings";
      if (isSettingsTransition) {
        setDirection(nextKey === "settings" ? 1 : -1);
      } else {
        setDirection(nextIndex > currentIndex ? 1 : -1);
      }
      setActiveScreen(nextKey);
    },
    [activeScreen, getNavigationIndex],
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

  const swipeHandlers = useSwipeNavigation({
    enabled: flowStage === FLOW_STAGES.MAIN && activeScreen !== "settings",
    threshold: SWIPE_THRESHOLD,
    onSwipe: goToNeighbor,
  });

  const renderFlowStage = () => {
    switch (flowStage) {
      case FLOW_STAGES.INTRO:
        return (
          <motion.div
            key="flow-intro"
            className="flow-stage flow-stage--intro"
            variants={FLOW_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FLOW_TRANSITION}
          >
            <StartScreen
              onContinue={() => setFlowStage(FLOW_STAGES.UNIVERSITY)}
            />
          </motion.div>
        );
      case FLOW_STAGES.UNIVERSITY:
        return (
          <motion.div
            key="flow-university"
            className="flow-stage flow-stage--university"
            variants={FLOW_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FLOW_TRANSITION}
          >
            <ChooseUniversity
              universities={universities}
              selectedId={selectedUniversity?.id}
              onSelect={(university) => {
                selectUniversity(university);
                setFlowStage(FLOW_STAGES.MAIN);
              }}
              onBack={() => setFlowStage(FLOW_STAGES.INTRO)}
            />
          </motion.div>
        );
      case FLOW_STAGES.MAIN:
      default:
        return (
          <motion.div
            key="flow-main"
            className="flow-stage flow-stage--main"
            variants={FLOW_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FLOW_TRANSITION}
          >
            <div className="app-shell">
              <main className="app-shell__content" {...swipeHandlers}>
                <div className="screen-stack">
                  <AnimatePresence
                    initial={false}
                    custom={direction}
                    mode="sync"
                  >
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
                      <ActiveScreen onNavigate={handleScreenChange} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
              <MenuBar
                activeItem={menuActiveItem}
                onChange={handleScreenChange}
              />
            </div>
          </motion.div>
        );
    }
  };

  return <AnimatePresence mode="wait">{renderFlowStage()}</AnimatePresence>;
};

export default App;
