// Ghim trên bản đồ triển lãm rơi xuống một lần khi bản đồ hiện đủ SHOW_RATIO trong màn hình (không lặp lại khi cuộn
// qua lại — người dùng yêu cầu hạn chế hiệu ứng cuộn, 2026-10-28).

const SHOW_RATIO = 0.25;

export default function ExhibitionModule() {
  const maps = [...document.querySelectorAll(".exhibitionMapJS")];
  if (!maps.length) return;

  if (!("IntersectionObserver" in window)) {
    maps.forEach((map) => map.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio < SHOW_RATIO) return;
      entry.target.classList.remove("is-pending");
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: [0, SHOW_RATIO] });

  maps.forEach((map) => {
    map.classList.add("is-pending");
    observer.observe(map);
  });
}
