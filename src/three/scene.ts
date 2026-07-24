import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createDigitalRain } from "./digitalRain";
import { createCenterpiece } from "./centerpiece";

export interface HeroSceneHandle {
  destroy: () => void;
}

function isLowPowerDevice(): boolean {
  return typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
}

export function initHeroScene(canvas: HTMLCanvasElement): HeroSceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  const lowPower = isLowPowerDevice();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 4;

  const viewportWidth = canvas.clientWidth || window.innerWidth;

  const rain = createDigitalRain(viewportWidth);
  scene.add(rain.mesh);

  // текст теперь сидит слева — на всех размерах сдвигаем 3D-акцент вправо, чтобы не перекрывать его
  const isNarrow = viewportWidth < 720;
  const isMedium = viewportWidth < 1100;
  const radius = isNarrow ? 0.85 : isMedium ? 1.15 : 1.35;
  const xOffset = isNarrow ? 0.55 : isMedium ? 1.15 : 1.55;
  const centerpiece = createCenterpiece(radius);
  centerpiece.mesh.position.set(xOffset, 0, 0);
  scene.add(centerpiece.mesh);

  const ambient = new THREE.AmbientLight(0x39ff8f, 0.5);
  scene.add(ambient);

  let composer: EffectComposer | null = null;

  if (!lowPower) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.6, 0.15));
  } else {
    rain.setQuality("low");
  }

  function setSize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / (height || 1);
    camera.updateProjectionMatrix();
    composer?.setSize(width, height);
  }

  setSize();

  const timer = new THREE.Timer();
  const pointer = { x: 0, y: 0 };

  function handlePointerMove(event: PointerEvent) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("resize", setSize);

  function renderFrame(timestamp?: number) {
    timer.update(timestamp);
    const t = timer.getElapsed();
    rain.update(t);
    centerpiece.update(t, pointer);

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  renderer.setAnimationLoop(renderFrame);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? true;
      renderer.setAnimationLoop(visible ? renderFrame : null);
    },
    { threshold: 0.05 }
  );
  observer.observe(canvas);

  return {
    destroy() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", setSize);
      observer.disconnect();
      rain.dispose();
      centerpiece.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
