// Thẻ dịch vụ xếp chồng khi cuộn (.stackingCardsJS, theo stacking-cards của fancycomponents.dev).
// - Chỉ bật xếp chồng (.is-stacking → thẻ sticky) khi mọi thẻ vừa phần màn hình dưới vị trí dính; thẻ cao hơn màn hình
//   mà sticky thì phần dưới (nút) sẽ bị thẻ sau che trước khi kịp xem.
// - Thẻ bị thẻ sau trượt lên che thì thu nhỏ dần: mỗi thẻ phía sau che được bao nhiêu (0..1) thì thẻ trước nhỏ đi
//   SCALE_STEP × phần đó (--stack-scale), tâm thu ở mép trên nên các mép trên ló ra thành từng bậc.

const SCALE_STEP = 0.04;

export default function StackingCardsModule() {
  const list = document.querySelector(".stackingCardsJS");
  if (!list) return;
  const cards = [...list.children];
  if (cards.length < 2) return;

  let frame = 0;
  let visible = false;

  const update = () => {
    frame = 0;
    if (!list.classList.contains("is-stacking")) return;
    const coverage = cards.map((card) => {
      const top = parseFloat(getComputedStyle(card).top) || 0;
      const distance = card.getBoundingClientRect().top - top;
      return Math.min(Math.max(1 - distance / card.offsetHeight, 0), 1);
    });
    cards.forEach((card, i) => {
      const covered = coverage.slice(i + 1).reduce((sum, value) => sum + value, 0);
      card.style.setProperty("--stack-scale", (1 - covered * SCALE_STEP).toFixed(4));
    });
  };

  const queue = () => {
    if (visible && !frame) frame = window.requestAnimationFrame(update);
  };

  const fit = () => {
    list.style.removeProperty("--stack-card-h");
    list.classList.add("is-stacking");
    const top = parseFloat(getComputedStyle(cards[cards.length - 1]).top) || 0;
    const tallest = Math.max(...cards.map((card) => card.offsetHeight));
    const fits = tallest <= window.innerHeight - top;
    list.classList.toggle("is-stacking", fits);
    if (fits) {
      list.style.setProperty("--stack-card-h", `${tallest}px`);
    } else {
      cards.forEach((card) => card.style.removeProperty("--stack-scale"));
    }
    queue();
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      queue();
    }, { rootMargin: "100px 0px" }).observe(list);
  } else {
    visible = true;
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", fit, { passive: true });
  fit();
  document.fonts?.ready.then(fit);
}
