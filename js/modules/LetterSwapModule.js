const STAGGER_MS = 30;
const SPRING = { damping: 30, stiffness: 300, mass: 1 };
const BOX_TRANSFORM = "translateZ(-0.5lh)";

const splitGraphemes = (text) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(document.documentElement.lang || undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }

  return Array.from(text);
};

const springTiming = ({ damping, stiffness, mass }) => {
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const decay = zeta * omega;
  const progress = (t) => 1 - Math.exp(-decay * t) * (Math.cos(omegaD * t) + (decay / omegaD) * Math.sin(omegaD * t));
  const duration = Math.log(1000) / decay;
  const steps = 40;
  const points = Array.from({ length: steps + 1 }, (_, i) => Number(progress((duration * i) / steps).toFixed(4)));
  points[steps] = 1;

  const easing = window.CSS?.supports?.("transition-timing-function", "linear(0, 1)")
    ? `linear(${points.join(", ")})`
    : "cubic-bezier(0.22, 1, 0.36, 1)";

  return { duration: Math.round(duration * 1000), easing };
};

const SPRING_TIMING = springTiming(SPRING);

const createSpan = (className, text) => {
  const span = document.createElement("span");
  span.className = className;
  if (text !== undefined) span.textContent = text;
  return span;
};

const buildLetters = (label) => {
  const text = label.textContent.trim().replace(/\s+/g, " ");
  const visual = createSpan("letter-swap");
  visual.setAttribute("aria-hidden", "true");

  text.split(" ").forEach((word, index, words) => {
    const wordElement = createSpan("letter-swap__word");

    splitGraphemes(word).forEach((char) => {
      const box = createSpan("letter-swap__box");
      box.append(createSpan("letter-swap__face", char), createSpan("letter-swap__face letter-swap__face--back", char));
      wordElement.append(box);
    });

    visual.append(wordElement);
    if (index < words.length - 1) visual.append(createSpan("letter-swap__space", " "));
  });

  label.replaceChildren(createSpan("sr-only", text), visual);
  return [...visual.querySelectorAll(".letter-swap__box")];
};

export default function LetterSwapModule() {
  const labels = document.querySelectorAll(".letterSwapJS");
  if (!labels.length || typeof Element.prototype.animate !== "function") return;

  labels.forEach((label) => {
    if (label.dataset.letterSwapReady) return;
    label.dataset.letterSwapReady = "true";

    let boxes = buildLetters(label);
    const trigger = label.closest("a, button") || label;

    label.addEventListener("letterswap:set", (event) => {
      label.textContent = event.detail;
      boxes = buildLetters(label);
    });
    let isAnimating = false;
    let isHovering = false;

    const play = async () => {
      if (isAnimating || isHovering) return;
      isHovering = true;
      isAnimating = true;

      const animations = boxes.map((box, index) => box.animate(
        [
          { transform: `${BOX_TRANSFORM} rotateX(0deg)` },
          { transform: `${BOX_TRANSFORM} rotateX(90deg)` },
        ],
        { ...SPRING_TIMING, delay: index * STAGGER_MS },
      ));

      await Promise.all(animations.map((animation) => animation.finished)).catch(() => {});
      isAnimating = false;
    };

    const end = () => {
      isHovering = false;
    };

    trigger.addEventListener("mouseenter", play);
    trigger.addEventListener("mouseleave", end);
    trigger.addEventListener("focus", () => {
      if (trigger.matches(":focus-visible")) play();
    });
    trigger.addEventListener("blur", end);
  });
}
