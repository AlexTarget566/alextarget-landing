const query = () => window.matchMedia("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion(): boolean {
  return query().matches;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mql = query();
  const handler = (event: MediaQueryListEvent) => callback(event.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
