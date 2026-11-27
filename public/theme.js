// Light/dark toggle. Loaded in <head> without defer so a saved choice is
// applied before the page paints (no flash of the wrong theme).
//
// The layout puts a hidden <button class="theme-toggle"> in the header; this
// script wires it up and shows it, so without JavaScript there's no dead button.
// A "themechange" event on document tells other scripts (Mermaid) to redraw.
(function () {
  var root = document.documentElement;
  var KEY = "theme";
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}

  function current() {
    return root.dataset.theme || (media.matches ? "dark" : "light");
  }

  function label(button) {
    var next = current() === "dark" ? "light" : "dark";
    button.textContent = next;
    button.setAttribute("aria-label", "Switch to " + next + " mode");
  }

  function changed() {
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: current() } }));
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".theme-toggle");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "theme-toggle theme-toggle--floating";
      document.body.appendChild(button);
    }
    label(button);
    button.hidden = false;
    button.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label(button);
      changed();
    });
    // Follow the OS setting live while no choice is saved.
    media.addEventListener("change", function () {
      label(button);
      if (!root.dataset.theme) changed();
    });
  });
})();
