document.addEventListener("DOMContentLoaded", function () {
  var menus = Array.from(document.querySelectorAll(".cv-menu"));
  function positionPanel(menu) {
    var panel = menu.querySelector(".cv-menu-panel");
    panel.style.transform = "";
    var bounds = panel.getBoundingClientRect();
    var left = Math.max(8, Math.min(bounds.left, document.documentElement.clientWidth - bounds.width - 8));
    panel.style.transform = "translateX(" + (left - bounds.left) + "px)";
  }
  menus.forEach(function (menu) {
    menu.addEventListener("toggle", function () {
      if (menu.open) {
        positionPanel(menu);
        menus.forEach(function (other) {
          if (other !== menu) other.open = false;
        });
      }
    });
    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
        event.preventDefault();
      }
    });
  });
  window.addEventListener("resize", function () {
    menus.forEach(function (menu) {
      if (menu.open) positionPanel(menu);
    });
  });
  document.addEventListener("click", function (event) {
    menus.forEach(function (menu) {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener("focusin", function (event) {
    menus.forEach(function (menu) {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
});
