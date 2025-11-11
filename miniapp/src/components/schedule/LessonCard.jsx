import { motion } from "motion/react";
import { getLessonCardMotion } from "../../animations/ScheduleAnimations";

const LessonCard = ({ lesson, index }) => {
  const motionConfig = getLessonCardMotion(index);

  return (
    <motion.article
      layout
      initial={motionConfig.initial}
      animate={motionConfig.animate}
      exit={motionConfig.exit}
      transition={motionConfig.transition}
      className={[
        "schedule-lesson-card",
        lesson.isCurrent ? "schedule-lesson-card--current" : "",
        !lesson.isCurrent && lesson.isPast ? "schedule-lesson-card--past" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="schedule-lesson-card__header">
        <div className="schedule-lesson-card__time">
          <span>{lesson.beginLesson}</span>
          <span>—</span>
          <span>{lesson.endLesson}</span>
        </div>
        <div className="schedule-lesson-card__tags">
          <div className="schedule-lesson-card__tag-row">
            {lesson.kindOfWork && (
              <span className="schedule-chip schedule-chip--kind">
                {lesson.kindOfWork}
              </span>
            )}
          </div>
          <div className="schedule-lesson-card__tag-row">
            {lesson.isCurrent && (
              <span className="schedule-chip schedule-chip--now">
                Идёт сейчас
              </span>
            )}
            {!lesson.isCurrent && lesson.countdownLabel && (
              <span className="schedule-chip schedule-chip--countdown">
                {lesson.countdownLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="schedule-lesson-card__body">
        <h3 className="schedule-lesson-card__title">{lesson.title}</h3>
        {lesson.extraDisciplines.length > 0 && (
          <p className="schedule-lesson-card__subtitle">
            {lesson.extraDisciplines.join(", ")}
          </p>
        )}
        {lesson.lecturers.length > 0 && (
          <div className="schedule-lesson-card__row">
            <p className="schedule-lesson-card__label">Преподаватель</p>
            <p className="schedule-lesson-card__value">
              {lesson.lecturers.join(", ") ||
                lesson.lecturerTitles.join(", ") ||
                "Не указан"}
            </p>
          </div>
        )}
        {lesson.rooms.length > 0 && (
          <div className="schedule-lesson-card__row">
            <p className="schedule-lesson-card__label">Аудитория</p>
            <p className="schedule-lesson-card__value">
              {lesson.rooms.join(", ")}
            </p>
          </div>
        )}
        {lesson.groups.length > 0 && lesson.streams.length === 0 && (
          <div className="schedule-lesson-card__row">
            <p className="schedule-lesson-card__label">Группы</p>
            <p className="schedule-lesson-card__value">
              {lesson.groups.join(", ")}
            </p>
          </div>
        )}
        {lesson.streams.length > 0 && (
          <div className="schedule-lesson-card__row">
            <p className="schedule-lesson-card__label">Поток</p>
            <p className="schedule-lesson-card__value">
              {lesson.streams.join(", ")}
            </p>
          </div>
        )}
        {lesson.urls.length > 0 && (
          <div className="schedule-lesson-card__links">
            {lesson.urls.map((link, linkIndex) => (
              <a
                key={`${lesson.id}-link-${linkIndex}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.description && link.description !== "none"
                  ? link.description
                  : "Ссылка"}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default LessonCard;
