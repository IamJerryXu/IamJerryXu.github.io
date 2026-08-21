$(document).ready(function () {
  var isMobile = window.matchMedia("(max-width: 575.98px)").matches;
  var zoomMargin = isMobile ? 28 : Math.min(220, Math.round(window.innerWidth * 0.15));
  medium_zoom = mediumZoom("[data-zoomable]", {
    background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee",
    margin: zoomMargin,
  });
});
