import { motion } from "motion/react";
import { emptyStateMotion } from "../../animations/ScheduleAnimations";

const EmptyState = ({ title, subtitle }) => (
  <motion.div
    layout
    className="schedule-empty"
    initial={emptyStateMotion.initial}
    animate={emptyStateMotion.animate}
    exit={emptyStateMotion.exit}
    transition={emptyStateMotion.transition}
  >
    <p className="schedule-empty__title">{title}</p>
    <p className="schedule-empty__subtitle">{subtitle}</p>
  </motion.div>
);

export default EmptyState;
