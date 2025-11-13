const financialUniversity = require("./financialUniversity");
const rgueUniversity = require("./rgeuUniversity");

const UNIVERSITIES = {
  [financialUniversity.id]: financialUniversity,
  [rgueUniversity.id]: rgueUniversity,
};

const DEFAULT_UNIVERSITY_ID = financialUniversity.id;

const getUniversityById = (id) => {
  if (!id) {
    return UNIVERSITIES[DEFAULT_UNIVERSITY_ID] ?? null;
  }
  return UNIVERSITIES[id] ?? null;
};

module.exports = {
  UNIVERSITIES,
  DEFAULT_UNIVERSITY_ID,
  getUniversityById,
};
