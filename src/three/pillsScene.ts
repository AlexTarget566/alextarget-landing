import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export interface PillsSceneHandle {
  destroy: () => void;
}

function isLowPowerDevice(): boolean {
  return typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
}

function createPill(color: THREE.ColorRepresentation): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(0.55, 1.7, 8, 24);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.3,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6,
  });
  return new THREE.Mesh(geometry, material);
}

export function initPillsScene(canvas: HTMLCanvasElement): PillsSceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }

  const lowPower = isLowPowerDevice();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const redPill = createPill(0xff2f5e);
  redPill.position.set(-1.9, 0.4, 0);
  redPill.rotation.z = 0.35;
  scene.add(redPill);

  const bluePill = createPill(0x29a3ff);
  bluePill.position.set(1.9, -0.4, -0.6);
  bluePill.rotation.z = -0.35;
  scene.add(bluePill);

  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const redLight = new THREE.PointLight(0xff2f5e, 8, 9);
  redLight.position.set(-1.9, 0.4, 2.2);
  scene.add(redLight);

  const blueLight = new THREE.PointLight(0x29a3ff, 8, 9);
  blueLight.position.set(1.9, -0.4, 2.2);
  scene.add(blueLight);

  let composer: EffectComposer | null = null;
  if (!lowPower) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.75, 0.7, 0.25));
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
  window.addEventListener("resize", setSize);

  const timer = new THREE.Timer();

  function renderFrame(timestamp?: number) {
    timer.update(timestamp);
    const t = timer.getElapsed();

    redPill.position.y = 0.4 + Math.sin(t * 0.6) * 0.18;
    redPill.rotation.x = Math.sin(t * 0.3) * 0.12;

    bluePill.position.y = -0.4 + Math.sin(t * 0.6 + Math.PI) * 0.18;
    bluePill.rotation.x = Math.sin(t * 0.3 + 1) * 0.12;

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
      window.removeEventListener("resize", setSize);
      observer.disconnect();
      redPill.geometry.dispose();
      (redPill.material as THREE.Material).dispose();
      bluePill.geometry.dispose();
      (bluePill.material as THREE.Material).dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
