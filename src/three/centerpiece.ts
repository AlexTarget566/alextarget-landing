import * as THREE from "three";
import vertexShader from "./shaders/glitch.vert.glsl";
import fragmentShader from "./shaders/glitch.frag.glsl";

export interface Pointer {
  x: number;
  y: number;
}

export interface Centerpiece {
  mesh: THREE.Mesh;
  update: (time: number, pointer: Pointer) => void;
  dispose: () => void;
}

export function createCenterpiece(radius = 1.4): Centerpiece {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: true,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uGlitchStrength: { value: 0.25 },
      uColor: { value: new THREE.Color("#39ff8f") },
      uOpacity: { value: 0.85 },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);

  let rotX = 0;
  let rotY = 0;

  return {
    mesh,
    update(time: number, pointer: Pointer) {
      material.uniforms.uTime.value = time;
      rotX += (pointer.y * 0.25 - rotX) * 0.04;
      rotY += (pointer.x * 0.25 - rotY) * 0.04;
      mesh.rotation.x = rotX + time * 0.04;
      mesh.rotation.y = rotY + time * 0.07;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
