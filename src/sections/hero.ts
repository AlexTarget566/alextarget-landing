import { mountLazyScene } from "../three/lazyMount";

export function initHero(): void {
  const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
  const fallback = document.querySelector<HTMLElement>(".hero__static-fallback");
  if (!canvas) return;

  mountLazyScene(canvas, fallback, async (c) => {
    const { initHeroScene } = await import("../three/scene");
    return initHeroScene(c);
  });
}
