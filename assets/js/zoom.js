$(document).ready(function () {
  var style = document.createElement("style");
  style.textContent = [
    ".figure-viewer{padding:8px;margin:auto;width:max-content;max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);overflow:auto;border:3px solid var(--global-theme-color);border-radius:8px;background:var(--global-bg-color);color:var(--global-text-color);box-shadow:0 12px 48px #0005}",
    ".figure-viewer::backdrop{background:rgba(15,25,30,.65);backdrop-filter:blur(5px)}",
    ".figure-viewer[open]{animation:figure-appear .2s ease-out}",
    ".figure-viewer-bar{display:flex;align-items:center;gap:8px;height:48px;padding:0 0 6px;border-bottom:1px solid var(--global-theme-color);margin-bottom:8px}",
    ".figure-viewer-title{font-size:16px;font-weight:500;color:var(--global-theme-color);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:calc(100vw - 150px)}",
    ".figure-viewer-action{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;padding:0;border:1px solid currentColor;border-radius:4px;background:var(--global-bg-color);color:var(--global-theme-color);font-size:26px;font-family:Arial,sans-serif;line-height:1;cursor:pointer}",
    ".figure-viewer-action:hover,.figure-viewer-action:focus-visible{border-color:currentColor;background:var(--global-code-bg-color);outline:2px solid transparent;text-decoration:none}",
    ".figure-viewer-image{display:block;width:auto;height:auto;max-width:calc(100vw - 52px);max-height:calc(100dvh - 114px);object-fit:contain;margin:auto;background:white;border-radius:3px}",
    ".cartoon-mode .figure-viewer{border-style:dashed;box-shadow:5px 5px 0 var(--global-theme-color)}",
    "[data-zoomable]{cursor:zoom-in}",
    "@keyframes figure-appear{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}",
    "@media(prefers-reduced-motion:reduce){.figure-viewer[open]{animation:none}}",
    "@media(max-width:575.98px){.figure-viewer{max-width:calc(100vw - 16px);padding:5px}.figure-viewer-image{max-width:calc(100vw - 30px)}.figure-viewer-title{font-size:14px}}"
  ].join("\n");
  document.head.appendChild(style);
  var dialog = document.createElement("dialog");
  dialog.className = "figure-viewer";
  dialog.setAttribute("aria-labelledby", "figure-viewer-title");
  dialog.innerHTML = '<div class="figure-viewer-bar"><span class="figure-viewer-title" id="figure-viewer-title"></span><a class="figure-viewer-action figure-viewer-original" target="_blank" rel="noopener"><span aria-hidden="true">&#8599;</span></a><button type="button" class="figure-viewer-action figure-viewer-close" autofocus><span aria-hidden="true">&times;</span></button></div><img class="figure-viewer-image">';
  document.body.appendChild(dialog);
  var picture = dialog.querySelector("img");
  var title = dialog.querySelector(".figure-viewer-title");
  var close = dialog.querySelector("button");
  var original = dialog.querySelector("a");
  var opener;
  var previousOverflow;
  close.addEventListener("click", function () { dialog.close(); });
  var backdropDown = false;
  function outside(event) {
    var bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  dialog.addEventListener("pointerdown", function (event) { backdropDown = outside(event); });
  dialog.addEventListener("click", function (event) { if (backdropDown && outside(event)) dialog.close(); });
  dialog.addEventListener("close", function () {
    document.body.style.overflow = previousOverflow;
    if (opener) opener.focus({ preventScroll: true });
  });
  document.querySelectorAll("[data-zoomable]").forEach(function (thumbnail) {
    thumbnail.tabIndex = 0;
    thumbnail.setAttribute("role", "button");
    thumbnail.setAttribute("aria-haspopup", "dialog");
    function openFigure(event) {
      event.preventDefault();
      if (dialog.open) return;
      opener = thumbnail;
      var chinese = document.documentElement.lang.indexOf("zh") === 0;
      close.title = chinese ? "关闭" : "Close";
      close.setAttribute("aria-label", close.title);
      original.title = chinese ? "查看原图" : "Open full-size image";
      original.setAttribute("aria-label", original.title);
      title.textContent = thumbnail.alt;
      picture.alt = thumbnail.alt;
      picture.onerror = function () { picture.onerror = null; picture.src = thumbnail.currentSrc || thumbnail.src; };
      picture.src = thumbnail.dataset.zoomSrc || thumbnail.currentSrc || thumbnail.src;
      original.href = picture.src;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
    }
    thumbnail.addEventListener("click", openFigure);
    thumbnail.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") openFigure(event);
    });
  });
});
