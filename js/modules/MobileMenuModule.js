export default function MobileMenuModule() {
  const nav = document.querySelector(".mobileNavJS");
  const menu = nav?.querySelector(".mobile-menu");
  const back = nav?.querySelector(".mobileBackJS");
  const title = nav?.querySelector(".mobileTitleJS");
  if (!menu || !back || !title) return;

  const panel = nav.closest(".site-menu__panel");
  const parents = [...menu.querySelectorAll(":scope > .menu-item-has-children")];
  let active = null;

  const linkOf = (item) => item.querySelector(":scope > a");

  const drill = (item) => {
    active = item;
    item.classList.add("is-active");
    menu.classList.remove("is-returning");
    nav.classList.add("is-drilled");
    title.textContent = linkOf(item).textContent;
    back.hidden = false;
    title.hidden = false;
    linkOf(item).setAttribute("aria-expanded", "true");
    panel?.scrollTo({ top: 0 });
    back.focus({ preventScroll: true });
  };

  const rise = (restoreFocus = true) => {
    if (!active) return;
    const link = linkOf(active);
    active.classList.remove("is-active");
    nav.classList.remove("is-drilled");
    menu.classList.toggle("is-returning", restoreFocus);
    back.hidden = true;
    title.hidden = true;
    link.setAttribute("aria-expanded", "false");
    if (restoreFocus) link.focus({ preventScroll: true });
    active = null;
  };

  parents.forEach((item, index) => {
    const link = linkOf(item);
    const sub = item.querySelector(":scope > .sub-menu");
    if (!link || !sub) return;
    sub.id ||= `mobile-sub-${index + 1}`;
    link.setAttribute("role", "button");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", sub.id);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      drill(item);
    });
    link.addEventListener("keydown", (event) => {
      if (event.key !== " ") return;
      event.preventDefault();
      drill(item);
    });
  });

  back.addEventListener("click", () => rise());

  document.querySelectorAll(".menuOpenJS").forEach((opener) => {
    opener.addEventListener("click", () => rise(false));
  });
}
