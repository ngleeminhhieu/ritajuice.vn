const TARGETS = [".lead"];
const ZONE = 0.5;
const DURATION = 700;
const IDLE_MS = 120;
const LOCK_MS = 200;
const INPUT_MS = 1000;
const EXTERNAL_MS = 600;
const SLACK = 0.1;
const KEYS_DOWN = new Set(["ArrowDown", "PageDown", " "]);
const KEYS_UP = new Set(["ArrowUp", "PageUp"]);

const cubicBezier = (x1, y1, x2, y2) => {
  const a = (p1, p2) => 1 - 3 * p2 + 3 * p1;
  const b = (p1, p2) => 3 * p2 - 6 * p1;
  const c = (p1) => 3 * p1;
  const at = (t, p1, p2) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t, p1, p2) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);

  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t = Math.min(Math.max(t - (at(t, x1, x2) - x) / s, 0), 1);
    }
    return at(t, y1, y2);
  };
};

const ease = cubicBezier(.5, 0, .2, 1);

export default function SectionSnapModule() {
  const sections = TARGETS.map((selector) => document.querySelector(selector)).filter(Boolean);
  if (!sections.length) return;

  const desktop = window.matchMedia("(min-width: 1121px)");
  const header = document.querySelector(".site-header");
  const footer = document.querySelector(".footerRevealJS");
  let lastY = window.scrollY;
  let direction = 0;
  let timer = 0;
  let animating = false;
  let lockUntil = 0;
  let lockDir = 0;
  let lastInput = 0;
  let pressed = false;

  const restingTop = (section, headerBottom) => {
    const rest = window.innerHeight - section.offsetHeight;
    return rest >= 0 && rest <= headerBottom + 2 ? rest : null;
  };

  const gapToSection = (inView) => {
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    for (const section of sections) {
      const top = restingTop(section, headerBottom);
      if (top === null) continue;
      const gap = section.getBoundingClientRect().top - top;
      const reach = inView ? window.innerHeight * (1 + SLACK) - top : window.innerHeight * ZONE;
      if (gap > 1 && gap <= reach) return gap;
    }
    return null;
  };

  const lastSectionOffset = () => {
    if (!footer?.classList.contains("is-sticky")) return null;
    const section = sections[sections.length - 1];
    const top = restingTop(section, header ? header.getBoundingClientRect().bottom : 0);
    return top === null ? null : section.getBoundingClientRect().top - top;
  };

  const gapToFooter = () => {
    const offset = lastSectionOffset();
    if (offset === null || offset > 1) return null;
    const gap = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    return gap > 1 ? gap : null;
  };

  const gapFromFooter = () => {
    const offset = lastSectionOffset();
    return offset !== null && offset < -1 ? offset : null;
  };

  const gapToPrevious = () => {
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    for (const section of sections) {
      const prev = section.previousElementSibling;
      const top = restingTop(section, headerBottom);
      if (!prev || top === null) continue;
      const offset = section.getBoundingClientRect().top - top;
      if (offset < -1 || offset > window.innerHeight * (1 + SLACK) - top) continue;
      const gap = Math.max(prev.getBoundingClientRect().top - headerBottom, -window.scrollY);
      if (gap < -1) return gap;
    }
    return null;
  };

  const glide = (gap) => {
    const start = window.scrollY;
    const startedAt = performance.now();
    animating = true;
    lockDir = Math.sign(gap);

    const step = (now) => {
      const progress = Math.min((now - startedAt) / DURATION, 1);
      window.scrollTo({ top: start + gap * ease(progress), behavior: "instant" });
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        animating = false;
        lockUntil = now + LOCK_MS;
      }
    };

    window.requestAnimationFrame(step);
  };

  const blocked = (target) => !desktop.matches || Boolean(target?.closest?.("dialog[open], select, textarea"));

  const handle = (event, down) => {
    if (blocked(event.target)) return;
    const now = performance.now();
    let gap = null;
    if (animating || ((down ? 1 : -1) === lockDir && now < lockUntil)) {
      if (!animating) lockUntil = now + LOCK_MS;
    } else {
      gap = down ? gapToSection(true) ?? gapToFooter() : gapFromFooter() ?? gapToPrevious();
      if (gap === null) return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (gap !== null) glide(gap);
  };

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey || !event.deltaY) return;
    lastInput = performance.now();
    handle(event, event.deltaY > 0);
  }, { capture: true, passive: false });

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest?.("input, select, textarea, button, [contenteditable]")) return;
    const down = KEYS_DOWN.has(event.key) && !event.shiftKey;
    const up = KEYS_UP.has(event.key) || (event.key === " " && event.shiftKey);
    if (!down && !up) return;
    lastInput = performance.now();
    handle(event, down);
  }, { capture: true });

  const settle = () => {
    if (animating || performance.now() < lockUntil || direction <= 0) return;
    if (!desktop.matches || performance.now() - lastInput < INPUT_MS) return;
    const gap = gapToSection(false);
    if (gap !== null) glide(gap);
  };

  window.addEventListener("pointerdown", () => {
    pressed = true;
  }, { capture: true, passive: true });
  ["pointerup", "pointercancel", "blur"].forEach((type) => {
    window.addEventListener(type, () => {
      pressed = false;
    }, { capture: true, passive: true });
  });

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (!animating && y !== lastY) direction = Math.sign(y - lastY);
    lastY = y;
    window.clearTimeout(timer);
    const now = performance.now();
    if (!animating && !pressed && direction > 0 && desktop.matches && now >= lockUntil && now - lastInput > EXTERNAL_MS) {
      const gap = gapToSection(true);
      if (gap !== null) {
        glide(gap);
        return;
      }
    }
    timer = window.setTimeout(settle, IDLE_MS);
  }, { passive: true });
}
