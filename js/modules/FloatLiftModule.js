// Nút nổi (cụm tiện ích mép trái + liên hệ nhanh mép phải) nằm thấp ở góc; khi cuộn tới footer (đáy <main> lên
// khỏi đáy màn hình, footer bắt đầu lộ) thì gắn html.is-footer-near để CSS nâng lên --float-bottom, không che chữ
// lớn cuối footer. Không dùng IntersectionObserver vì footer sticky luôn nằm trong màn hình (chỉ bị main che).

export default function FloatLiftModule() {
  const main = document.querySelector("main");
  if (!main) return;

  const root = document.documentElement;
  let frame = 0;

  const update = () => {
    frame = 0;
    root.classList.toggle("is-footer-near", main.getBoundingClientRect().bottom < window.innerHeight - 1);
  };

  const queue = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  update();
}
