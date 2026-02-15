"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function NebulaPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColorA: { value: new THREE.Color("#06141b") },
      uColorB: { value: new THREE.Color("#0b2b33") },
      uColorC: { value: new THREE.Color("#f3c875") },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uMouse.value.set(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5
    );
  });

  return (
    <mesh scale={[8, 5, 1]}>
      <planeGeometry args={[2, 1.2, 220, 220]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        depthWrite={false}
        transparent
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 3.0 + uTime * 0.35) * 0.04;
            pos.z += cos(pos.y * 3.5 - uTime * 0.28) * 0.04;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(a, b, u.x) +
                   (c - a) * u.y * (1.0 - u.x) +
                   (d - b) * u.x * u.y;
          }

          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 6; i++) {
              value += amplitude * noise(p);
              p *= 2.02;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            vec2 uv = vUv;
            vec2 p = uv * 2.0 - 1.0;

            float n = fbm(uv * 2.8 + vec2(uTime * 0.03, -uTime * 0.05));
            float n2 = fbm(uv * 4.2 + vec2(-uTime * 0.04, uTime * 0.02));
            float blend = smoothstep(0.15, 0.95, n + n2 * 0.42);

            vec3 color = mix(uColorA, uColorB, blend);

            float glow = smoothstep(0.62, 0.0, distance(uv, uMouse));
            color += uColorC * glow * 0.12;

            float vignette = smoothstep(1.35, 0.18, length(p));
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

export default function GlobalNebula() {
  return (
    <div className="global-nebula" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        gl={{ antialias: false, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <NebulaPlane />
      </Canvas>
    </div>
  );
}
