precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uColumns;
uniform float uRows;
uniform sampler2D uGlyphTex;
uniform float uGlyphGridSize;
uniform vec3 uColorHead;
uniform vec3 uColorTrail;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  vec2 uv = vUv;

  float col = floor(uv.x * uColumns);
  float colRand = hash11(col + 0.5);

  float speed = 0.15 + colRand * 0.5;
  float offset = hash11(col + 99.0) * 40.0;
  float trailLen = 0.2 + hash11(col + 55.0) * 0.4;

  float y = uv.y + uTime * speed + offset;
  float d = fract(y);
  float brightness = clamp(1.0 - d / trailLen, 0.0, 1.0);
  brightness = pow(brightness, 1.6);

  float rowIndex = floor(uv.y * uRows);
  float flickerTick = floor(uTime * 4.0);
  float glyphId = floor(
    hash11(rowIndex * 12.9 + col * 78.2 + flickerTick * 3.3) * (uGlyphGridSize * uGlyphGridSize)
  );
  vec2 glyphCell = vec2(mod(glyphId, uGlyphGridSize), floor(glyphId / uGlyphGridSize));
  vec2 cellUv = vec2(fract(uv.x * uColumns), fract(uv.y * uRows));
  vec2 glyphUv = (glyphCell + cellUv) / uGlyphGridSize;
  float glyphAlpha = texture2D(uGlyphTex, glyphUv).r;

  vec3 color = mix(uColorTrail, uColorHead, brightness);
  float alpha = brightness * glyphAlpha;

  if (alpha < 0.02) discard;

  gl_FragColor = vec4(color, alpha);
}
