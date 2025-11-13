import ModalSheet from "./ModalSheet";
import { getRoleById } from "./utils";

const LeaderPanel = ({
  project,
  userDirectory,
  onClose,
  onEdit,
  onDelete,
  onRespondRequest,
}) => {
  if (!project) {
    return null;
  }

  const roles = project.roles || [];
  const participants = (project.participants || []).map((participant) => {
    const user =
      userDirectory[participant.userId] || {
        fullName: "Участник",
        group: "",
      };
    const role = getRoleById(roles, participant.roleId);
    return { ...participant, user, role };
  });

  const pendingRequests = (project.pendingRequests || []).filter(
    (request) => request.status === "pending",
  );

  return (
    <ModalSheet onClose={onClose} className="leader-modal">
      <div className="leader-panel">
        <header className="leader-panel__header">
          <div>
            <p className="leader-panel__eyebrow">Управление проектом</p>
            <h3>{project.title}</h3>
          </div>
          <button type="button" className="leader-panel__close" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="leader-panel__section">
          <h4>Участники</h4>
          <ul className="leader-panel__list">
            {participants.map((participant) => (
              <li key={`${participant.userId}-${participant.roleId}`}>
                <div>
                  <p>{participant.user.fullName}</p>
                  <span>
                    {participant.role?.name || "роль не указана"}
                    {participant.user.group ? ` • ${participant.user.group}` : ""}
                  </span>
                </div>
              </li>
            ))}
            {participants.length === 0 && (
              <li className="leader-panel__muted">Пока никто не присоединился.</li>
            )}
          </ul>
        </section>

        <section className="leader-panel__section">
          <h4>Заявки</h4>
          {pendingRequests.length === 0 ? (
            <p className="leader-panel__muted">Новых заявок нет.</p>
          ) : (
            <ul className="leader-panel__requests">
              {pendingRequests.map((request) => (
                <li key={request.id} className="leader-panel__request">
                  <div>
                    <p className="leader-panel__request-name">
                      {request.user?.fullName || "Студент"}
                    </p>
                    <span>
                      {request.user?.university}, {request.user?.course} курс,
                      {" "}
                      {request.user?.group}
                    </span>
                    <p className="leader-panel__request-role">
                      Роль: {getRoleById(roles, request.roleId)?.name || "не указана"}
                    </p>
                    {request.message && (
                      <p className="leader-panel__request-message">“{request.message}”</p>
                    )}
                  </div>
                  <div className="leader-panel__request-actions">
                    <button
                      type="button"
                      className="leader-panel__action leader-panel__action--accept"
                      onClick={() => onRespondRequest(project.id, request.id, "accepted")}
                    >
                      Принять
                    </button>
                    <button
                      type="button"
                      className="leader-panel__action leader-panel__action--decline"
                      onClick={() => onRespondRequest(project.id, request.id, "declined")}
                    >
                      Отклонить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="leader-panel__footer">
          <button
            type="button"
            className="leader-panel__primary"
            onClick={() => onEdit(project)}
          >
            Редактировать
          </button>
          <button
            type="button"
            className="leader-panel__danger"
            onClick={() => onDelete(project.id)}
          >
            Удалить
          </button>
        </div>
      </div>
    </ModalSheet>
  );
};

export default LeaderPanel;
