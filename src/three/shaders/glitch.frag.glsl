precision highp float;

varying vec3 vNormal;

uniform vec3 uColor;
uniform float uOpacity;

void main() {
  float fresnel = pow(1.0 - abs(vNormal.z), 2.0);
  vec3 color = uColor * (0.55 + fresnel);
  gl_FragColor = vec4(color, uOpacity);
}
