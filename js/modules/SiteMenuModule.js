export default function SiteMenuModule() {
  const menu = document.querySelector(".siteMenuJS");
  const openers = [...document.querySelectorAll(".menuOpenJS")];
  if (!menu || !openers.length || typeof menu.showModal !== "function") return;

  const panel = menu.querySelector(".site-menu__panel");
  let closeTimer = 0;

  const setExpanded = (expanded) => {
    openers.forEach((opener) => opener.setAttribute("aria-expanded", String(expanded)));
  };

  const finishClose = () => {
    window.clearTimeout(closeTimer);
    if (!menu.classList.contains("is-closing")) return;
    menu.classList.remove("is-closing");
    menu.close();
    setExpanded(false);
  };

  const close = () => {
    if (!menu.open || menu.classList.contains("is-closing")) return;
    menu.classList.add("is-closing");
    const duration = parseFloat(getComputedStyle(menu).animationDuration) * 1000 || 0;
    closeTimer = window.setTimeout(finishClose, duration + 50);
  };

  openers.forEach((opener) => {
    opener.addEventListener("click", () => {
      if (menu.open) return;
      menu.classList.remove("is-closing");
      menu.showModal();
      panel.scrollTop = 0;
      setExpanded(true);
    });
  });

  menu.addEventListener("animationend", (event) => {
    if (event.target === menu && !event.pseudoElement) finishClose();
  });

  menu.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  menu.addEventListener("close", () => setExpanded(false));

  menu.addEventListener("click", (event) => {
    if (event.target.closest(".menuCloseJS") || !event.target.closest(".site-menu__panel")) close();
  });
}
