// Поиск расписания по ключу из текст инпута

export const parseIdSchedule = async (term) => {
  if (!term) return [];
  try {
    const response = await fetch(
      `http://localhost:4000/api/schedule/search?term=${encodeURIComponent(
        term
      )}`
    );
    if (!response.ok) throw new Error("Ошибка поиска расписания");
    const data = await response.json();
    return data || [];
  } catch (e) {
    console.error("parseIdSchedule error:", e);
    return [];
  }
};

// Поиск необходимого расписания

export const parseSchedule = async (
  profileId,
  profileType,
  startIso,
  endIso
) => {
  if (!profileId || !profileType || !startIso || !endIso) return [];
  try {
    const response = await fetch(
      `http://localhost:4000/api/schedule?profileId=${profileId}&profileType=${profileType}&start=${startIso}&end=${endIso}`
    );
    if (!response.ok) throw new Error("Ошибка загрузки расписания");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("parseSchedule error:", e);
    return [];
  }
};
