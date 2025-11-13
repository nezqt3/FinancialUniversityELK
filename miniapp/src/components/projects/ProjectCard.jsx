import { motion } from "motion/react";
import { sumFilled } from "./utils";
import RoleList from "./RoleList";

const ProjectCard = ({ project, currentUser, onOpenDetails, onOpenManage }) => {
  const roles = project.roles || [];
  const filled = sumFilled(roles);
  const capacity =
    project.maxPeople ||
    roles.reduce((total, role) => total + Number(role.requiredCount || 0), 0);
  const isLeader = Boolean(
    currentUser && project.leader?.id && project.leader.id === currentUser.id,
  );
  const participants = Array.isArray(project.participants)
    ? project.participants
    : [];
  const isParticipant = Boolean(
    currentUser &&
      participants.some((participant) => participant.userId === currentUser.id),
  );

  return (
    <motion.article
      layout
      className="project-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="project-card__head">
        <div>
          <div className="project-card__badge">
            {project.visibility === "open" ? "Открытый" : "Закрытый"}
          </div>
          <h3 className="project-card__title">{project.title}</h3>
        </div>
      {project.tags?.length > 0 && (
        <div className="project-card__tags">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {project.tags.length > 3 && (
            <span className="project-card__tag-more">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}
      </div>

      {project.description && (
        <p className="project-card__description">{project.description}</p>
      )}

      {project.leader && (
        <div className="project-card__leader">
          <span className="project-card__leader-label">Лидер</span>
          <div>
            <div className="project-card__leader-name">
              {project.leader.fullName}
            </div>
            <p>
              {project.leader.university}, {project.leader.course} курс,
              {" "}
              {project.leader.group}
            </p>
          </div>
        </div>
      )}

      <RoleList roles={roles} />

      <div className="project-card__footer">
        <div className="project-card__capacity">
          Команда: {filled}/{capacity}
        </div>
        <div className="project-card__actions">
          <button
            type="button"
            className="project-card__action"
            onClick={onOpenDetails}
          >
            Подробнее
          </button>
          {isLeader && (
            <button
              type="button"
              className="project-card__action project-card__action--secondary"
              onClick={onOpenManage}
            >
              Управление
            </button>
          )}
          {!isLeader && isParticipant && (
            <span className="project-card__badge project-card__badge--secondary">
              Вы в команде
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;
