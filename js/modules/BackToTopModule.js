export default function BackToTopModule() {
  const button = document.querySelector(".backToTopJS");
  if (!button) return;

  let frame = 0;

  const update = () => {
    frame = 0;
    button.classList.toggle("is-visible", window.scrollY > window.innerHeight);
  };

  window.addEventListener("scroll", () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  }, { passive: true });

  button.addEventListener("click", (event) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (event.detail === 0) document.querySelector(".site-logo")?.focus({ preventScroll: true });
  });

  update();
}
