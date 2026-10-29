// Ghi chú bàn giao backend:
// Mỗi tab là một <form> riêng, thay bằng 3 form Contact Form 7 (giữ class lead-form__grid / lead-field
// trong template của CF7; ô radio CF7 tự sinh đúng markup wpcf7-list-item như bản tĩnh).
// Khi đã dùng CF7 thì bỏ phần chặn submit và dòng thông báo bên dưới (CF7 tự gửi và hiện thông báo).

const THANKS = "Cảm ơn bạn! RITA sẽ liên hệ lại trong 24 giờ làm việc.";

export default function LeadFormModule() {
  const tablist = document.querySelector(".leadTabsJS");
  if (!tablist) return;

  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const frame = tablist.closest(".lead__form");
  const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

  const select = (tab, focus = false) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      panelOf(item).hidden = !active;
    });
    // Khối tab trắng của lớp nền gooey trượt tới tab đang chọn
    frame?.style.setProperty("--lead-tab", tabs.indexOf(tab));
    if (focus) tab.focus();
  };

  // Đặt khối tab gooey đúng tab đang chọn sẵn trong HTML
  frame?.style.setProperty("--lead-tab", Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")));

  // Link tới form kèm data-lead-tab (vd. nút trong thẻ dịch vụ) thì mở sẵn tab tương ứng
  document.querySelectorAll("[data-lead-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = document.getElementById(`lead-tab-${link.dataset.leadTab}`);
      if (tab && tabs.includes(tab)) select(tab);
    });
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
    });
  });

  document.querySelectorAll(".leadFormJS").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".leadStatusJS");
      if (status) status.textContent = THANKS;
      form.reset();
    });
  });
}
