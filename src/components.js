(function () {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const icon = (name) => {
    const paths = {
      add: '<path d="M12 5v14M5 12h14"/>',
      check: '<path d="m5 12 4 4 10-10"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
      calendar: '<path d="M7 3v4M17 3v4M4 9h16M5 5h14v15H5z"/>',
      book: '<path d="M4 5.5c3-.8 5.8-.2 8 1.8v12c-2.2-2-5-2.6-8-1.8z"/><path d="M20 5.5c-3-.8-5.8-.2-8 1.8v12c2.2-2 5-2.6 8-1.8z"/>',
      chart: '<rect x="4" y="13" width="3.2" height="7" rx="0.8" fill="currentColor" stroke="none"/><rect x="10.4" y="9" width="3.2" height="11" rx="0.8" fill="currentColor" stroke="none"/><rect x="16.8" y="6" width="3.2" height="14" rx="0.8" fill="currentColor" stroke="none"/><path d="M4 11.8 8.2 7.5l4.2 3.8 3.2-3.2 4.8-4.9" fill="none" stroke="var(--panel, #071426)" stroke-width="5.2"/><path d="M16.2 3.2h4.2v4.2" fill="none" stroke="var(--panel, #071426)" stroke-width="5.2"/><path d="M4 11.8 8.2 7.5l4.2 3.8 3.2-3.2 4.8-4.9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M16.2 3.2h4.2v4.2" fill="none" stroke="currentColor" stroke-width="2.6"/>',
      bot: '<path d="M12 3v3"/><rect x="5" y="6" width="14" height="12" rx="4"/><path d="M8.5 11h.01M15.5 11h.01"/><path d="M9 15h6"/>',
      cards: '<path d="M7 6h11v13H7z"/><path d="M4 9h3v10h11"/>',
      spark: '<path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z"/>',
      clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      camera: '<path d="M14.5 5 16 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3l1.5-3z"/><circle cx="12" cy="14" r="3"/>',
      language: '<path d="M4 5h9M8.5 3v2M6 5c.5 4 2.5 7 6 9"/><path d="M11 5c-.6 3.8-2.8 7.2-7 9"/><path d="m14 20 3.5-9 3.5 9M15.2 17h4.6"/>',
      refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.5A7 7 0 0 1 18 6l2 2M18 15.5A7 7 0 0 1 6 18l-2-2"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
      mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.5-3.3 1.7 1.7 0 0 1 1.3-2.8H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><path d="M7.5 10.5h.01M9.5 7.5h.01M14.5 7.5h.01M16.5 10.5h.01"/>',
      send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
      upload: '<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      edit: '<path d="M12 20h9"/><path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 15h10l1-15"/><path d="M10 11v6M14 11v6"/>',
      folder: '<path d="M3 6h7l2 2h9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'
    };
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
  };

  const mascot = (extraClass = "") => `
    <span class="mascot ${escapeHtml(extraClass)}" aria-hidden="true">
      <img class="mascot-face" src="/src/assets/lynxly-avatar.webp" alt="" width="64" height="64" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/src/assets/lynxly-avatar.png';" />
    </span>
  `;

  const sectionTitle = (eyebrow, title) => `
    <section class="section-heading">
      <span>${escapeHtml(eyebrow)}</span>
      <h1>${escapeHtml(title)}</h1>
    </section>
  `;

  const statCard = (label, value, subtext, iconName) => `
    <article class="stat-card"><div class="stat-icon">${icon(iconName)}</div><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(subtext)}</small></div></article>
  `;

  const emptyState = (title, text) => `<div class="empty-state mascot-empty">${mascot("mascot-small")}<div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></div>`;
  const priorityClass = (priority) => priority === "Hoch" ? "danger" : priority === "Mittel" ? "warning" : "calm";
  const difficultyLabel = (difficulty) => Number(difficulty) >= 3 ? "Schlecht" : Number(difficulty) === 2 ? "Okay" : "Gut";
  const difficultyClass = (difficulty) => Number(difficulty) >= 3 ? "bad" : Number(difficulty) === 2 ? "ok" : "good";

  window.StudyUpComponents = { escapeHtml, icon, mascot, sectionTitle, statCard, emptyState, priorityClass, difficultyLabel, difficultyClass };
})();

