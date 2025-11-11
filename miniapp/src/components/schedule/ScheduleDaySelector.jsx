import { motion } from "motion/react";
import { dayButtonTap } from "../../animations/ScheduleAnimations";

const ScheduleDaySelector = ({ weekDays, selectedDayIndex, onSelect }) => (
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
          onClick={() => onSelect(index)}
          layout
          whileTap={dayButtonTap}
        >
          <span>{day.labelShort}</span>
          <strong>{day.dayNumber}</strong>
        </motion.button>
      );
    })}
  </div>
);

export default ScheduleDaySelector;
