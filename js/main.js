import HeaderModule from "./modules/HeaderModule.js";
import CategoryPageModule from "./modules/CategoryPageModule.js";
import HeaderSearchModule from "./modules/HeaderSearchModule.js";
import SiteMenuModule from "./modules/SiteMenuModule.js";
import MobileMenuModule from "./modules/MobileMenuModule.js";
import LetterSwapModule from "./modules/LetterSwapModule.js";
import HeroModule from "./modules/HeroModule.js";
import NewsModule from "./modules/NewsModule.js";
import RevealModule from "./modules/RevealModule.js";
import ExhibitionModule from "./modules/ExhibitionModule.js";
import ParallaxModule from "./modules/ParallaxModule.js";
import LeadFormModule from "./modules/LeadFormModule.js";
import FooterRevealModule from "./modules/FooterRevealModule.js";
import BackToTopModule from "./modules/BackToTopModule.js";
import DecorToggleModule from "./modules/DecorToggleModule.js";
import PetalFallModule from "./modules/PetalFallModule.js";
import FloatLiftModule from "./modules/FloatLiftModule.js";
import SectionSnapModule from "./modules/SectionSnapModule.js";
import AboutReelModule from "./modules/AboutReelModule.js";
import CountUpModule from "./modules/CountUpModule.js";
import StackingCardsModule from "./modules/StackingCardsModule.js";

const init = () => {
  [
    HeaderModule,
    CategoryPageModule,
    HeaderSearchModule,
    SiteMenuModule,
    MobileMenuModule,
    LetterSwapModule,
    HeroModule,
    NewsModule,
    RevealModule,
    ExhibitionModule,
    ParallaxModule,
    LeadFormModule,
    FooterRevealModule,
    BackToTopModule,
    DecorToggleModule,
    PetalFallModule,
    FloatLiftModule,
    SectionSnapModule,
    AboutReelModule,
    CountUpModule,
    StackingCardsModule,
  ].forEach((module) => {
    try {
      module();
    } catch (error) {
      console.error(`${module.name || "module"} failed to start`, error);
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
