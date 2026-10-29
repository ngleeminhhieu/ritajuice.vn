// Bảng điều khiển Trang trí Tết: nút trong cụm nút nổi mở bảng .decorPanelJS gồm
// - bật / tắt trang trí (html.decor-off: ẩn cành ở header, tranh footer, hoa mai + viền chạy mục Hàng Tết, hoa rơi)
// - chọn hoa mai / hoa đào (html[data-flower="dao"]: đổi cành ở header và cánh hoa rơi)
// - bật / tắt hoa rơi (html.petals-off)
// Lựa chọn lưu localStorage (rita-decor, rita-flower, rita-petals) để giữ qua các trang; đoạn script nhỏ trong <head>
// áp dụng từ sớm để không nháy. Mỗi lần đổi phát sự kiện "decor:change" cho PetalFallModule.

const KEYS = { decor: "rita-decor", flower: "rita-flower", petals: "rita-petals" };

const store = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn đổi được trong trang hiện tại
  }
};

export default function DecorToggleModule() {
  const button = document.querySelector(".decorToggleJS");
  const panel = document.querySelector(".decorPanelJS");
  if (!button || !panel) return;

  const root = document.documentElement;
  const onInput = panel.querySelector(".decorOnJS");
  const petalsInput = panel.querySelector(".decorPetalsJS");
  const flowerInputs = [...panel.querySelectorAll('input[name="decor-flower"]')];

  const emit = () => document.dispatchEvent(new CustomEvent("decor:change"));

  const sync = () => {
    const on = !root.classList.contains("decor-off");
    const flower = root.dataset.flower === "dao" ? "dao" : "mai";
    onInput.checked = on;
    petalsInput.checked = !root.classList.contains("petals-off");
    petalsInput.disabled = !on;
    flowerInputs.forEach((input) => {
      input.checked = input.value === flower;
      input.disabled = !on;
    });
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => setOpen(panel.hidden));
  document.addEventListener("click", (event) => {
    if (!panel.hidden && !event.target.closest(".decor-control")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || panel.hidden) return;
    setOpen(false);
    button.focus();
  });

  onInput.addEventListener("change", () => {
    root.classList.toggle("decor-off", !onInput.checked);
    store(KEYS.decor, onInput.checked ? "" : "off");
    sync();
    emit();
  });

  petalsInput.addEventListener("change", () => {
    root.classList.toggle("petals-off", !petalsInput.checked);
    store(KEYS.petals, petalsInput.checked ? "" : "off");
    emit();
  });

  flowerInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      if (input.value === "dao") root.dataset.flower = "dao";
      else delete root.dataset.flower;
      store(KEYS.flower, input.value === "dao" ? "dao" : "");
      emit();
    });
  });

  sync();
}
