import { initScrollReveal } from "../utils/scrollReveal";
import { mountLazyScene } from "../three/lazyMount";

export function initServices(): void {
  initScrollReveal(".service-card");

  const canvas = document.getElementById("services-canvas") as HTMLCanvasElement | null;
  const fallback = document.querySelector<HTMLElement>(".services__static-fallback");
  if (!canvas) return;

  mountLazyScene(
    canvas,
    fallback,
    async (c) => {
      const { initPillsScene } = await import("../three/pillsScene");
      return initPillsScene(c);
    },
    { deferUntilVisible: true }
  );
}
