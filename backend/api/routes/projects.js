const express = require("express");
const {
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
} = require("../storage/projectsStore");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const projects = listProjects();
    res.json(projects);
  } catch (error) {
    console.error("Failed to list projects", error);
    res.status(500).json({ error: "Не удалось получить проекты" });
  }
});

router.post("/", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res
      .status(400)
      .json({ error: "Некорректные данные проекта" });
  }
  try {
    const project = saveProject(payload);
    res.json(project);
  } catch (error) {
    console.error("Failed to save project", error);
    res.status(500).json({ error: "Не удалось сохранить проект" });
  }
});

router.put("/:projectId", (req, res) => {
  const { projectId } = req.params;
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res
      .status(400)
      .json({ error: "Некорректные данные проекта" });
  }
  try {
    const project = saveProject({ ...payload, id: projectId });
    res.json(project);
  } catch (error) {
    console.error("Failed to update project", error);
    res.status(500).json({ error: "Не удалось обновить проект" });
  }
});

router.delete("/:projectId", (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    return res.status(400).json({ error: "Не указан идентификатор" });
  }
  try {
    const existing = getProjectById(projectId);
    if (!existing) {
      return res.status(404).json({ error: "Проект не найден" });
    }
    deleteProject(projectId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project", error);
    res.status(500).json({ error: "Не удалось удалить проект" });
  }
});

module.exports = router;
