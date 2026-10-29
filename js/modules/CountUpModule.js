// Đếm số các thông số nổi bật (.countUpJS, data-to) khi lướt tới, chỉ một lần. Không có JS thì hiện sẵn số cuối.

const DURATION = 1600;

export default function CountUpModule() {
  const items = [...document.querySelectorAll(".countUpJS")];
  if (!items.length || !("IntersectionObserver" in window)) return;

  const format = new Intl.NumberFormat("vi-VN");

  const run = (el) => {
    const to = Number(el.dataset.to) || 0;
    const begin = performance.now();
    const step = (now) => {
      const t = Math.min((now - begin) / DURATION, 1);
      el.textContent = format.format(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      run(entry.target);
    });
  }, { threshold: 0.6 });

  items.forEach((el) => {
    el.textContent = "0";
    observer.observe(el);
  });
}
