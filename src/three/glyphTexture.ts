import * as THREE from "three";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface GlyphAtlas {
  texture: THREE.CanvasTexture;
  gridSize: number;
}

/**
 * Генерирует один раз текстуру-атлас с сеткой символов (gridSize x gridSize).
 * Шейдер дождя сэмплит из неё нужную ячейку вместо рендера текста на лету.
 */
export function createGlyphAtlas(gridSize = 16): GlyphAtlas {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = gridSize * cell;
  canvas.height = gridSize * cell;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context недоступен для генерации глифов");
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${cell * 0.72}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < gridSize * gridSize; i++) {
    const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const cx = (i % gridSize) * cell + cell / 2;
    const cy = Math.floor(i / gridSize) * cell + cell / 2;
    ctx.fillText(glyph, cx, cy);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return { texture, gridSize };
}
