import { prefersReducedMotion, onReducedMotionChange } from "./reducedMotion";

export interface LazySceneHandle {
  destroy: () => void;
}

type SceneStarter = (
  canvas: HTMLCanvasElement
) => LazySceneHandle | null | Promise<LazySceneHandle | null>;

function scheduleIdle(fn: () => void): void {
  if ("requestIdleCallback" in window) {
    (
      window as unknown as {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback(fn, { timeout: 1500 });
  } else {
    setTimeout(fn, 200);
  }
}

export function mountLazyScene(
  canvas: HTMLCanvasElement,
  fallback: HTMLElement | null,
  start: SceneStarter,
  options: { deferUntilVisible?: boolean } = {}
): void {
  let handle: LazySceneHandle | null = null;
  let started = false;

  function showFallback() {
    fallback?.classList.add("is-active");
  }

  function hideFallback() {
    fallback?.classList.remove("is-active");
  }

  async function startScene() {
    if (handle) return;
    try {
      const result = await start(canvas);
      if (!result) {
        showFallback();
        return;
      }
      handle = result;
      hideFallback();
    } catch {
      showFallback();
    }
  }

  function stopScene() {
    handle?.destroy();
    handle = null;
  }

  function requestStart() {
    if (started) return;
    started = true;
    showFallback();
    scheduleIdle(() => void startScene());
  }

  function applyMotionPreference(reduced: boolean) {
    if (reduced) {
      started = false;
      stopScene();
      showFallback();
      return;
    }

    if (options.deferUntilVisible) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            requestStart();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(canvas);
    } else {
      requestStart();
    }
  }

  applyMotionPreference(prefersReducedMotion());
  onReducedMotionChange(applyMotionPreference);
}
