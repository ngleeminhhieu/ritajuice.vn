// Hiệu ứng khi cuộn tới — chỉ dùng ở nơi cần (người dùng yêu cầu hạn chế fade / trượt, 2026-10-28) và chỉ chạy một
// lần: hiện xong thì thôi theo dõi, cuộn lên / xuống không ẩn lại.
// - Lon ở dải CTA nhô lên lần lượt (các nhãn chú thích trên lon chờ lon hiện xong mới hiện — xem .cta-can__spot).
// - Ảnh banner danh mục (showcase) thu nhẹ về đúng cỡ, không trượt.

const RULES = [
  { items: ".showcase__banner", type: "zoom-out", children: ".showcase__image" },
  { items: ".cta-band__can", type: "rise", step: 120 },
];

const MAX_STEPS = 8;

export default function RevealModule() {
  if (!("IntersectionObserver" in window)) return;

  const owners = new Map();

  RULES.forEach((rule, index) => {
    document.querySelectorAll(rule.items).forEach((el) => {
      if (owners.has(el)) return;
      const targets = rule.children ? [...el.querySelectorAll(rule.children)] : [el];
      targets.forEach((target) => {
        target.dataset.reveal = rule.type;
      });
      owners.set(el, { group: index, step: rule.step || 0, targets });
    });
  });

  if (!owners.size) return;

  const observer = new IntersectionObserver((entries) => {
    const counters = new Map();
    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
      .forEach((entry) => {
        const { group, step, targets } = owners.get(entry.target);
        const order = counters.get(group) || 0;
        counters.set(group, order + 1);
        targets.forEach((target, i) => {
          const index = targets.length > 1 ? i : order;
          target.style.setProperty("--reveal-delay", `${Math.min(index, MAX_STEPS) * step}ms`);
          target.classList.add("is-inview");
        });
        observer.unobserve(entry.target);
      });
  }, { rootMargin: "0px 0px -8% 0px" });

  const root = document.documentElement;
  root.classList.add("reveal-ready", "reveal-instant");
  owners.forEach((_, el) => observer.observe(el));
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => root.classList.remove("reveal-instant"));
  });
}
