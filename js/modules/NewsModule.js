const GROUP = 2;
const PAIRS_IN_VIEW = 2;

export default function NewsModule() {
  const section = document.querySelector(".newsJS");
  const slider = section?.querySelector(".newsSliderJS");
  if (!slider || typeof window.Swiper !== "function") return;

  const desktop = window.matchMedia("(min-width: 1121px)");
  const phone = window.matchMedia("(max-width: 680px)");
  const slides = [...slider.querySelectorAll(".swiper-slide")];
  const gap = parseFloat(getComputedStyle(slider).getPropertyValue("--news-gap")) || 16;
  let swiper = null;

  const pairOffset = () => {
    const group = slides.slice(0, GROUP * PAIRS_IN_VIEW).reduce((sum, slide) => sum + slide.offsetWidth, 0) + gap * (GROUP * PAIRS_IN_VIEW - 1);
    return Math.round((slider.clientWidth - group) / 2);
  };

  const create = () => {
    swiper?.destroy(true, true);
    swiper = null;
    if (phone.matches) return;
    const wide = desktop.matches;
    swiper = new window.Swiper(slider, {
      slidesPerView: "auto",
      spaceBetween: gap,
      speed: 700,
      centeredSlides: !wide,
      slidesPerGroup: wide ? GROUP : 1,
      slidesOffsetBefore: wide ? pairOffset() : 0,
      loop: true,
      loopedSlides: slides.length,
      grabCursor: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      navigation: {
        prevEl: section.querySelector(".newsPrevJS"),
        nextEl: section.querySelector(".newsNextJS"),
      },
      a11y: {
        enabled: true,
        prevSlideMessage: "Tin trước",
        nextSlideMessage: "Tin sau",
        containerMessage: "Dải tin tức RITA. Kéo để xem thêm bài viết.",
        slideLabelMessage: "Tin tức {{index}} trên {{slidesLength}}",
      },
    });
  };

  let frame = 0;
  window.addEventListener("resize", () => {
    if (!desktop.matches || !swiper) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      swiper.params.slidesOffsetBefore = pairOffset();
      swiper.update();
      swiper.slideToLoop(swiper.realIndex, 0);
    });
  });

  desktop.addEventListener("change", create);
  phone.addEventListener("change", create);
  create();
}
