import { initScrollReveal } from "../utils/scrollReveal";

export function initCases(): void {
  initScrollReveal(".case-card");

  document.querySelectorAll<HTMLImageElement>(".case-card__thumb img").forEach((img) => {
    img.addEventListener("error", () => {
      img.closest<HTMLElement>(".case-card__thumb")?.style.setProperty("display", "none");
    });
  });
}
