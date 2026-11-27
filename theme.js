// Light/dark toggle. Loaded in <head> without defer so a saved choice is
// applied before the page paints (no flash of the wrong theme).
(function () {
  var root = document.documentElement;
  var KEY = "theme";

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}

  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function label(button) {
    var next = current() === "dark" ? "light" : "dark";
    button.textContent = next;
    button.setAttribute("aria-label", "Switch to " + next + " mode");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    label(button);
    button.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label(button);
    });
    // Keep the label right if the OS setting changes while no choice is saved.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      label(button);
    });
    document.body.appendChild(button);
  });
})();
