(() => {
  const STORAGE_KEY = "workshop-zuteilung-github-pages-v2";
  const LEGACY_STORAGE_KEY = "workshop-zuteilung-github-pages-v1";

  function emptyProject() {
    return {
      name: "Neue Workshop-Veranstaltung",
      settings: {
        allowOutside: false,
        defaultMode: "Pflicht",
        balanceWeight: 10,
        balanceThreshold: 10,
        cohortMin: 0,
        qualityMode: "standard",
        rules: []
      },
      workshops: [],
      participants: [],
      locks: []
    };
  }

  function currentProjectName() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return String(parsed?.name || document.querySelector("#eventName")?.value || "Aktuelles Projekt").trim();
    } catch {
      return String(document.querySelector("#eventName")?.value || "Aktuelles Projekt").trim();
    }
  }

  function deleteProject() {
    const projectName = currentProjectName();
    const confirmed = window.confirm(
      `Projekt „${projectName}“ wirklich löschen?\n\n` +
      "Alle lokal gespeicherten Workshops, Teilnehmer, Sperrungen, Regeln und Ergebnisse dieses Projekts werden entfernt. Dieser Schritt kann nicht rückgängig gemacht werden."
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyProject()));
    window.location.reload();
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#deleteProjectBtn")?.addEventListener("click", deleteProject);
  });
})();
