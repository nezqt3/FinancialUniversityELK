import { AnimatePresence, motion } from "motion/react";
import { skeletonRowAnimation } from "../../animations/ScheduleAnimations";
import EmptyState from "./EmptyState";
import LessonCard from "./LessonCard";

const ScheduleSkeleton = () => (
  <div className="schedule-skeleton">
    {Array.from({ length: 3 }).map((_, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <motion.div
        key={index}
        className="schedule-skeleton__row"
        initial={skeletonRowAnimation.initial}
        animate={skeletonRowAnimation.animate}
        transition={skeletonRowAnimation.transition}
      />
    ))}
  </div>
);

const ScheduleLessonsList = ({
  hasProfile,
  hasError,
  isLoading,
  isReady,
  lessons,
  preparedLessons,
}) => {
  const hasLessons = preparedLessons.length > 0;

  return (
    <div className="schedule-lessons">
      {!hasProfile && (
        <EmptyState
          title="Профиль не выбран"
          subtitle="Введите имя группы или преподавателя, чтобы увидеть расписание."
        />
      )}

      {hasProfile && hasError && (
        <EmptyState
          title="Не удалось загрузить данные"
          subtitle="Попробуйте выбрать другую дату или повторите попытку позже."
        />
      )}

      {hasProfile && isLoading && <ScheduleSkeleton />}

      {hasProfile && !isLoading && isReady && !lessons.length && (
        <EmptyState
          title="Пар нет"
          subtitle="На выбранный день занятия не запланированы."
        />
      )}

      <AnimatePresence mode="sync">
        {hasProfile && !isLoading && hasLessons &&
          preparedLessons.map((lesson, index) => (
            <LessonCard key={lesson.id} lesson={lesson} index={index} />
          ))}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleLessonsList;
