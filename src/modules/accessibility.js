(function () {
  const modules = window.LynxlyModules || {};

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const firstFocusable = (root) => root?.querySelector?.(focusableSelector) || null;

  const focusFirst = (root) => {
    const target = firstFocusable(root);
    if (target) target.focus();
    return target;
  };

  const announce = (message, liveId = "xp-live") => {
    const node = document.getElementById(liveId);
    if (node) node.textContent = String(message || "");
  };

  modules.accessibility = { announce, firstFocusable, focusFirst, focusableSelector };
  window.LynxlyModules = modules;
})();
