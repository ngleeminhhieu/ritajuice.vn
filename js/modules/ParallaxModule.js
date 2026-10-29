export default function ParallaxModule() {
  const layers = [...document.querySelectorAll(".parallaxJS")];
  if (!layers.length) return;

  const active = new Set();
  let frame = 0;

  const update = () => {
    frame = 0;
    const viewport = window.innerHeight;
    active.forEach((layer) => {
      const box = layer.parentElement.getBoundingClientRect();
      const room = (layer.offsetHeight - box.height) / 2;
      const range = (viewport + box.height) / 2;
      const progress = Math.max(-1, Math.min(1, (box.top + box.height / 2 - viewport / 2) / range));
      layer.style.setProperty("--parallax-y", `${(-progress * room).toFixed(1)}px`);
    });
  };

  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          active.add(entry.target);
        } else {
          active.delete(entry.target);
        }
      });
      requestUpdate();
    }, { rootMargin: "100px 0px" });
    layers.forEach((layer) => observer.observe(layer));
  } else {
    layers.forEach((layer) => active.add(layer));
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();
}
