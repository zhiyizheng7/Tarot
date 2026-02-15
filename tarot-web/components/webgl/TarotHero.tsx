"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function HeroScene() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColorA: { value: new THREE.Color("#0c2d39") },
      uColorB: { value: new THREE.Color("#f3c875") },
      uColorC: { value: new THREE.Color("#0a4a57") },
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
    <>
      <mesh position={[0, 0, 0]} scale={[7, 3.8, 1]}>
        <planeGeometry args={[2, 1.2, 180, 180]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          vertexShader={`
            varying vec2 vUv;
            uniform float uTime;

            void main() {
              vUv = uv;
              vec3 pos = position;
              float waveA = sin((pos.x * 3.5) + uTime * 0.9) * 0.05;
              float waveB = cos((pos.y * 4.0) - uTime * 0.75) * 0.05;
              pos.z += waveA + waveB;
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
              float amp = 0.5;
              for (int i = 0; i < 5; i++) {
                value += amp * noise(p);
                p *= 2.03;
                amp *= 0.5;
              }
              return value;
            }

            void main() {
              vec2 uv = vUv;

              float n1 = fbm(uv * 3.4 + vec2(uTime * 0.05, -uTime * 0.07));
              float n2 = fbm(uv * 5.2 + vec2(-uTime * 0.08, uTime * 0.04));
              float blend = smoothstep(0.15, 0.95, n1 + n2 * 0.35);

              vec3 base = mix(uColorA, uColorC, blend);
              base = mix(base, uColorB, smoothstep(0.72, 1.0, blend) * 0.3);

              float d = distance(uv, uMouse);
              float halo = smoothstep(0.32, 0.0, d) * 0.45;
              vec3 color = base + uColorB * halo;

              float vignette = smoothstep(0.9, 0.25, distance(uv, vec2(0.5)));
              color *= vignette + 0.18;

              gl_FragColor = vec4(color, 0.9);
            }
          `}
        />
      </mesh>

      <Float speed={1.1} floatIntensity={0.6} rotationIntensity={0.5}>
        <mesh position={[1.05, -0.22, 0.8]}>
          <icosahedronGeometry args={[0.38, 28]} />
          <meshPhysicalMaterial
            color="#f0d8a0"
            transmission={0.9}
            roughness={0.12}
            metalness={0.05}
            thickness={1.6}
            clearcoat={1}
            clearcoatRoughness={0.15}
            opacity={0.8}
            transparent
          />
        </mesh>
      </Float>
    </>
  );
}

function FallbackHero() {
  return (
    <div className="hero-fallback">
      <div className="hero-fallback-glow" />
    </div>
  );
}

export default function TarotHero() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setPref = () => setReducedMotion(media.matches);
    setPref();
    media.addEventListener("change", setPref);
    return () => media.removeEventListener("change", setPref);
  }, []);

  return (
    <section className="hero-panel">
      <div className="hero-canvas-wrap">
        {reducedMotion ? (
          <FallbackHero />
        ) : (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 2.4], fov: 45 }}
            gl={{ antialias: false, alpha: true }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <HeroScene />
          </Canvas>
        )}
      </div>

      <div className="hero-overlay">
        <p className="hero-kicker">Ritual Console</p>
        <h1 className="hero-title title-serif">Arcana Mirror</h1>
        <p className="hero-subtitle">你的直覺入口，從提問到解牌像一場儀式</p>
      </div>
    </section>
  );
}
