import { useEffect, useState } from "react";
import ModalSheet from "./ModalSheet";
import { generateId, findUniversityMatch } from "./utils";

const ProjectFormModal = ({
  project,
  universities = [],
  defaultUniversity,
  onClose,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState(() =>
    createEmptyForm(defaultUniversity),
  );
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [roleErrors, setRoleErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormValues({
        title: project.title,
        description: project.description,
        tags: project.tags || [],
        roles:
          project.roles?.map((role) => ({
            id: role.id,
            name: role.name,
            requiredCount: role.requiredCount,
            filledCount: role.filledCount,
          })) || [],
        visibility: project.visibility,
        allowedUniversities:
          project.allowedUniversities?.map((value) => {
            const match = findUniversityMatch(value);
            return match?.id || value;
          }) || [],
        minCourse: project.minCourse,
        maxCourse: project.maxCourse,
        leaderRoleId: project.leaderRoleId || "",
      });
    } else {
      setFormValues(createEmptyForm(defaultUniversity));
    }
    setTagInput("");
    setErrors({});
    setRoleErrors({});
    setFormError("");
  }, [project, defaultUniversity]);

  const validateForm = () => {
    const nextErrors = {};
    const nextRoleErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = "Укажите название проекта";
    }
    if (!formValues.description.trim()) {
      nextErrors.description = "Добавьте описание";
    }
    if (!formValues.roles.length) {
      nextErrors.roles = "Добавьте хотя бы одну роль";
    }

    formValues.roles.forEach((role) => {
      const roleError = {};
      if (!role.name.trim()) {
        roleError.name = "Название роли обязательно";
      }
      if (!role.requiredCount || Number(role.requiredCount) < 1) {
        roleError.requiredCount = "Минимум 1 место";
      }
      if (Object.keys(roleError).length > 0) {
        nextRoleErrors[role.id] = roleError;
      }
    });

    if (
      Number(formValues.minCourse) > 0 &&
      Number(formValues.maxCourse) > 0 &&
      Number(formValues.minCourse) > Number(formValues.maxCourse)
    ) {
      nextErrors.minCourse =
        "Минимальный курс не может быть больше максимального";
      nextErrors.maxCourse = "Проверьте значения курса";
    }

    if (!formValues.allowedUniversities.length) {
      nextErrors.allowedUniversities = "Выберите хотя бы один университет";
    }

    setErrors(nextErrors);
    setRoleErrors(nextRoleErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextRoleErrors).length === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      const normalizedForm = {
        ...formValues,
        allowedUniversities: formValues.allowedUniversities.map((value) => {
          const match = findUniversityMatch(value);
          return match?.id || value;
        }),
      };
      await onSubmit(normalizedForm, project?.id);
    } catch (submitError) {
      setFormError(
        submitError?.message ||
          "Не удалось сохранить изменения. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (roleId, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId ? { ...role, [field]: value } : role,
      ),
    }));
  };

  const handleAddRole = () => {
    setFormValues((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: generateId("role"),
          name: "",
          requiredCount: 1,
          filledCount: 0,
        },
      ],
    }));
  };

  const handleRemoveRole = (roleId) => {
    setFormValues((prev) => ({
      ...prev,
      roles: prev.roles.filter((role) => role.id !== roleId),
      leaderRoleId: prev.leaderRoleId === roleId ? "" : prev.leaderRoleId,
    }));
  };

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) {
      return;
    }
    setFormValues((prev) => ({
      ...prev,
      tags: prev.tags.includes(nextTag) ? prev.tags : [...prev.tags, nextTag],
    }));
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    setFormValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  };

  const toggleUniversity = (universityId) => {
    setFormValues((prev) => {
      const exists = prev.allowedUniversities.includes(universityId);
      return {
        ...prev,
        allowedUniversities: exists
          ? prev.allowedUniversities.filter((item) => item !== universityId)
          : [...prev.allowedUniversities, universityId],
      };
    });
  };

  const handleLeaderRoleChange = (roleId) => {
    setFormValues((prev) => ({
      ...prev,
      leaderRoleId: roleId,
    }));
  };

  return (
    <ModalSheet onClose={onClose} className="project-form-modal">
      <form className="project-form" onSubmit={handleSubmit}>
        <header className="project-form__header">
          <div>
            <p className="project-form__eyebrow">
              {project ? "Редактирование" : "Новый проект"}
            </p>
            <h3>{project ? "Обновите проект" : "Создайте проект"}</h3>
          </div>
          <button type="button" className="project-form__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="project-form__field">
          <label>
            Название проекта<span>*</span>
          </label>
          <input
            type="text"
            value={formValues.title}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, title: event.target.value }))
            }
            className={errors.title ? "has-error" : ""}
          />
          {errors.title && <p className="project-form__error">{errors.title}</p>}
        </div>

        <div className="project-form__field">
          <label>
            Описание<span>*</span>
          </label>
          <textarea
            value={formValues.description}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            className={errors.description ? "has-error" : ""}
          />
          {errors.description && (
            <p className="project-form__error">{errors.description}</p>
          )}
        </div>

        <div className="project-form__field">
          <label>Теги</label>
          <div className="project-form__tags">
            <input
              type="text"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="Например, IT"
            />
            <button type="button" onClick={handleAddTag}>
              Добавить
            </button>
          </div>
          {formValues.tags.length > 0 && (
            <div className="project-form__tag-list">
              {formValues.tags.map((tag) => (
                <span key={tag}>
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="project-form__field">
          <div className="project-form__roles-head">
            <label>
              Роли<span>*</span>
            </label>
            <button type="button" onClick={handleAddRole}>
              Добавить роль
            </button>
          </div>
          {errors.roles && <p className="project-form__error">{errors.roles}</p>}
          <div className="project-form__roles">
            {formValues.roles.map((role) => (
              <div key={role.id} className="project-form__role">
                <input
                  type="text"
                  placeholder="Название"
                  value={role.name}
                  onChange={(event) =>
                    handleRoleChange(role.id, "name", event.target.value)
                  }
                  className={roleErrors[role.id]?.name ? "has-error" : ""}
                />
                <input
                  type="number"
                  min="1"
                  value={role.requiredCount}
                  onChange={(event) =>
                    handleRoleChange(role.id, "requiredCount", event.target.value)
                  }
                  className={
                    roleErrors[role.id]?.requiredCount ? "has-error" : ""
                  }
                />
                <button type="button" onClick={() => handleRemoveRole(role.id)}>
                  —
                </button>
                {roleErrors[role.id]?.name && (
                  <p className="project-form__error">{roleErrors[role.id].name}</p>
                )}
                {roleErrors[role.id]?.requiredCount && (
                  <p className="project-form__error">
                    {roleErrors[role.id].requiredCount}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {formValues.roles.length > 0 && (
          <div className="project-form__field">
            <label>Роль лидера</label>
            <select
              value={formValues.leaderRoleId}
              onChange={(event) => handleLeaderRoleChange(event.target.value)}
            >
              <option value="">Без роли</option>
              {formValues.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name || "Без названия"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="project-form__field">
          <label>Тип доступа</label>
          <div className="project-form__radios">
            <label>
              <input
                type="radio"
                name="visibility"
                value="open"
                checked={formValues.visibility === "open"}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    visibility: event.target.value,
                  }))
                }
              />
              Открытый проект (можно вступить сразу)
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="closed"
                checked={formValues.visibility === "closed"}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    visibility: event.target.value,
                  }))
                }
              />
              Закрытый проект (по заявке)
            </label>
          </div>
        </div>

        <div className="project-form__field">
          <label>
            Университеты<span>*</span>
          </label>
          <div
            className={`project-form__checkboxes${errors.allowedUniversities ? " has-error" : ""}`}
          >
            {universities.map((university) => (
              <label key={university.id}>
                <input
                  type="checkbox"
                  checked={formValues.allowedUniversities.includes(university.id)}
                  onChange={() => toggleUniversity(university.id)}
                />
                {university.label}
              </label>
            ))}
          </div>
          {errors.allowedUniversities && (
            <p className="project-form__error">{errors.allowedUniversities}</p>
          )}
        </div>

        <div className="project-form__field project-form__field--inline">
          <div>
            <label>
              Минимальный курс<span>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={formValues.minCourse}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  minCourse: Number(event.target.value),
                }))
              }
              className={errors.minCourse ? "has-error" : ""}
            />
            {errors.minCourse && (
              <p className="project-form__error">{errors.minCourse}</p>
            )}
          </div>
          <div>
            <label>
              Максимальный курс<span>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={formValues.maxCourse}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  maxCourse: Number(event.target.value),
                }))
              }
              className={errors.maxCourse ? "has-error" : ""}
            />
            {errors.maxCourse && (
              <p className="project-form__error">{errors.maxCourse}</p>
            )}
          </div>
        </div>

        {formError && <div className="project-form__error">{formError}</div>}

        <div className="project-form__actions">
          <button type="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
};

const createEmptyForm = (defaultUniversity = "") => ({
  title: "",
  description: "",
  tags: [],
  roles: [
    {
      id: generateId("role"),
      name: "",
      requiredCount: 1,
      filledCount: 0,
    },
  ],
  visibility: "open",
  leaderRoleId: "",
  allowedUniversities: defaultUniversity ? [defaultUniversity] : [],
  minCourse: 1,
  maxCourse: 4,
});

export default ProjectFormModal;
