import { motion } from "motion/react";
import { scheduleWeekMotion } from "../../animations/ScheduleAnimations";

const ScheduleWeekNavigator = ({ weekRangeLabel, weekOffset, onChange }) => (
  <motion.div
    className="schedule-week"
    layout
    initial={scheduleWeekMotion.initial}
    animate={scheduleWeekMotion.animate}
    transition={scheduleWeekMotion.transition}
  >
    <button type="button" onClick={() => onChange(-1)}>
      ←
    </button>
    <div>
      <p>{weekRangeLabel}</p>
      <span>
        {weekOffset === 0 ? "Текущая неделя" : `Смещение: ${weekOffset}`}
      </span>
    </div>
    <button type="button" onClick={() => onChange(1)}>
      →
    </button>
  </motion.div>
);

export default ScheduleWeekNavigator;
