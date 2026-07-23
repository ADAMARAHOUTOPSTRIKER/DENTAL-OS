"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  RoundedBox,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

// Forces a synchronous render at mount so the scene always paints at least one
// frame, even if the tab's requestAnimationFrame loop is throttled/paused.
function FrameKick() {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    const draw = () => {
      gl.render(scene, camera);
      invalidate();
    };
    draw();
    const t1 = setTimeout(draw, 120); // after env map / materials settle
    const t2 = setTimeout(draw, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gl, scene, camera, invalidate]);
  return null;
}

function Molar() {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    // Cursor parallax — smooth tilt toward pointer
    target.current.x = THREE.MathUtils.lerp(
      target.current.x,
      state.pointer.y * 0.35,
      0.05
    );
    target.current.y = THREE.MathUtils.lerp(
      target.current.y,
      state.pointer.x * 0.5,
      0.05
    );
    if (group.current) {
      group.current.rotation.x = target.current.x;
      group.current.rotation.y = target.current.y + state.clock.elapsedTime * 0.18;
    }
  });

  const enamel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fbfbf7",
        roughness: 0.18,
        metalness: 0.0,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        sheen: 0.6,
        sheenColor: new THREE.Color("#d8fff8"),
        envMapIntensity: 1.1,
      }),
    []
  );

  // Cusp positions on the crown top
  const cusps: [number, number, number][] = [
    [-0.42, 0.62, -0.42],
    [0.42, 0.62, -0.42],
    [-0.42, 0.62, 0.42],
    [0.42, 0.62, 0.42],
    [0, 0.72, 0],
  ];
  // Two tapered roots
  const roots: [number, number, number][] = [
    [-0.28, -0.95, 0],
    [0.28, -0.95, 0],
  ];

  return (
    <group ref={group} scale={1.15} position={[0, 0.1, 0]}>
      {/* Crown body */}
      <RoundedBox args={[1.15, 1.1, 1.15]} radius={0.42} smoothness={8} material={enamel} />
      {/* Cusps */}
      {cusps.map((p, i) => (
        <mesh key={i} position={p} material={enamel} scale={i === 4 ? 0.34 : 0.42}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
      ))}
      {/* Roots */}
      {roots.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, i === 0 ? 0.14 : -0.14]} material={enamel}>
          <coneGeometry args={[0.3, 1.15, 32]} />
        </mesh>
      ))}
    </group>
  );
}

export default function ToothScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.7} color="#7fecdd" />
      <pointLight position={[2, -3, 4]} intensity={0.6} color="#ffb765" />

      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
        <Molar />
      </Float>

      {/* Procedural studio environment (no network fetch) */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 3, 2]} scale={[6, 3, 1]} color="#eafffb" />
        <Lightformer intensity={1.2} position={[-3, 1, 1]} scale={[3, 3, 1]} color="#7fecdd" />
        <Lightformer intensity={1} position={[3, -1, 1]} scale={[3, 3, 1]} color="#ffcf99" />
      </Environment>

      <ContactShadows
        position={[0, -1.7, 0]}
        opacity={0.35}
        scale={7}
        blur={2.6}
        far={4}
        color="#0d3040"
      />
      <FrameKick />
    </Canvas>
  );
}
