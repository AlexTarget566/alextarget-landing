import * as THREE from "three";
import vertexShader from "./shaders/rain.vert.glsl";
import fragmentShader from "./shaders/rain.frag.glsl";
import { createGlyphAtlas } from "./glyphTexture";

export interface DigitalRain {
  mesh: THREE.Mesh;
  update: (time: number) => void;
  setQuality: (quality: "high" | "low") => void;
  dispose: () => void;
}

export function createDigitalRain(viewportWidth: number): DigitalRain {
  const atlas = createGlyphAtlas();
  const baseColumns = Math.max(20, Math.floor(viewportWidth / 26));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uColumns: { value: baseColumns },
      uRows: { value: 40 },
      uGlyphTex: { value: atlas.texture },
      uGlyphGridSize: { value: atlas.gridSize },
      uColorHead: { value: new THREE.Color("#eafff2") },
      uColorTrail: { value: new THREE.Color("#0a8f52") },
    },
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  return {
    mesh,
    update(time: number) {
      material.uniforms.uTime.value = time;
    },
    setQuality(quality: "high" | "low") {
      material.uniforms.uRows.value = quality === "low" ? 24 : 40;
      material.uniforms.uColumns.value =
        quality === "low" ? Math.floor(baseColumns * 0.6) : baseColumns;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      atlas.texture.dispose();
    },
  };
}
