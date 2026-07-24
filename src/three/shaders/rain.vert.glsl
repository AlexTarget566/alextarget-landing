varying vec2 vUv;

void main() {
  vUv = uv;
  // фулскрин-плейн: пишем клип-координаты напрямую, без учёта камеры
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
