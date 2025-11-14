const { getFirestore } = require("./firebaseClient");

const COLLECTION_NAME = "projects";

const withTimestamps = (payload) => {
  const now = new Date().toISOString();
  return {
    ...payload,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
};

const listProjects = async () => {
  const snapshot = await getFirestore()
    .collection(COLLECTION_NAME)
    .orderBy("updatedAt", "desc")
    .get();
  return snapshot.docs.map((doc) => doc.data());
};

const getProjectById = async (projectId) => {
  if (!projectId) {
    return null;
  }
  const doc = await getFirestore()
    .collection(COLLECTION_NAME)
    .doc(projectId)
    .get();
  return doc.exists ? doc.data() : null;
};

const saveProject = async (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Project payload is required");
  }
  const id = payload.id || getFirestore().collection(COLLECTION_NAME).doc().id;
  const record = withTimestamps({
    ...payload,
    id,
  });
  await getFirestore().collection(COLLECTION_NAME).doc(id).set(record);
  return record;
};

const deleteProject = async (projectId) => {
  if (!projectId) {
    return;
  }
  await getFirestore().collection(COLLECTION_NAME).doc(projectId).delete();
};

module.exports = {
  listProjects,
  saveProject,
  getProjectById,
  deleteProject,
};
