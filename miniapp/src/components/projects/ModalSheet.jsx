import { motion } from "motion/react";

const ModalSheet = ({ children, onClose, className = "" }) => (
  <motion.div
    className="projects-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={(event) => {
      if (event.target === event.currentTarget) {
        onClose?.();
      }
    }}
  >
    <motion.div
      className={`projects-overlay__panel ${className}`}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default ModalSheet;
