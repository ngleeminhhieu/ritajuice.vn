// Sticky footer: footer đứng yên phía sau, section lead trượt lên để lộ ra (xem .site-footer.is-sticky trong site.css).
// Đo chiều cao footer vào --footer-h để footer cao hơn màn hình bám ngay dưới header thay vì mép dưới (không mất phần đầu).

export default function FooterRevealModule() {
  const footer = document.querySelector(".footerRevealJS");
  if (!footer) return;

  const measure = () => footer.style.setProperty("--footer-h", `${footer.offsetHeight}px`);
  footer.classList.add("is-sticky");
  measure();
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(footer);
  else window.addEventListener("resize", measure, { passive: true });
}
