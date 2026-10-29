export default function HeaderModule() {
  const header = document.querySelector(".siteHeaderJS");
  if (!header) return;

  const STUCK_AFTER = 4;
  const parents = [...header.querySelectorAll(".primary-menu > .menu-item-has-children")];
  const touch = window.matchMedia("(hover: none)");
  let frame = 0;

  const update = () => {
    frame = 0;
    header.classList.toggle("is-stuck", window.scrollY > STUCK_AFTER);
  };

  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("pageshow", requestUpdate);
  update();

  const linkOf = (item) => item.querySelector(":scope > a");

  // Chuột có thật sự di chuyển không: so toạ độ với lần trước ở pha capture (chạy trước listener của từng mục), để bỏ qua
  // pointermove giả trình duyệt phát ra sau khi cuộn / layout đổi (toạ độ không đổi)
  const lastPointer = { x: -1, y: -1 };
  let pointerMoved = false;
  window.addEventListener("pointermove", (event) => {
    pointerMoved = event.clientX !== lastPointer.x || event.clientY !== lastPointer.y;
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
  }, { capture: true, passive: true });

  // Đang cuộn thì đóng menu con mở bằng chuột (giữ lại nếu đang dùng bàn phím trong menu)
  window.addEventListener("scroll", () => {
    parents.forEach((item) => {
      if (item.classList.contains("is-open") && !item.contains(document.activeElement)) setOpen(item, false);
    });
  }, { passive: true });

  const sync = (item) => {
    linkOf(item)?.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
  };

  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    sync(item);
  };

  const closeOthers = (current) => {
    parents.forEach((item) => {
      if (item !== current) setOpen(item, false);
    });
  };

  parents.forEach((item) => {
    const link = linkOf(item);
    link?.setAttribute("aria-haspopup", "true");
    link?.setAttribute("aria-expanded", "false");

    // Chỉ mở khi chuột thật sự di chuyển trong mục (pointermove đổi toạ độ). mouseenter / :hover cũng xảy ra khi hàng menu
    // nhảy lên dưới con trỏ đang để yên lúc cuộn (thanh đỏ trên cùng thu lại) → menu con tự bung dù không rê chuột.
    item.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !pointerMoved || item.classList.contains("is-open")) return;
      closeOthers(item);
      setOpen(item, true);
    });

    item.addEventListener("mouseleave", () => setOpen(item, false));

    link?.addEventListener("click", (event) => {
      if (!touch.matches || item.classList.contains("is-open")) return;
      event.preventDefault();
      closeOthers(item);
      setOpen(item, true);
    });

    item.addEventListener("focusin", () => {
      closeOthers(item);
      setOpen(item, true);
    });

    item.addEventListener("focusout", (event) => {
      if (!item.contains(event.relatedTarget)) setOpen(item, false);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !item.classList.contains("is-open")) return;
      setOpen(item, false);
      link?.focus();
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".primary-menu > .menu-item-has-children")) return;
    parents.forEach((item) => setOpen(item, false));
  });
}
