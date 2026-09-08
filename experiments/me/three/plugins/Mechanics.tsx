"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group } from "three";
import { Block } from "../Hardware";
type V = [number, number, number];
export function MechanicalPart({
  name,
  assembled,
  exploded,
  phase = [0.1, 0.9],
  spread,
  reduced,
  children,
  semanticLayer,
}: {
  name: string;
  assembled: V;
  exploded: V;
  phase?: [number, number];
  spread: number;
  reduced: boolean;
  children: ReactNode;
  semanticLayer?: string;
}) {
  const ref = useRef<Group>(null),
    { invalidate } = useThree();
  useEffect(() => invalidate(), [spread, invalidate]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    let t = Math.max(
      0,
      Math.min(1, (spread - phase[0]) / (phase[1] - phase[0])),
    );
    t = t * t * (3 - 2 * t);
    let delta = 0;
    (["x", "y", "z"] as const).forEach((axis, i) => {
      const target = assembled[i] + (exploded[i] - assembled[i]) * t;
      ref.current!.position[axis] +=
        (target - ref.current!.position[axis]) *
        (reduced ? 1 : 1 - Math.exp(-dt * 12));
      delta += Math.abs(target - ref.current!.position[axis]);
    });
    if (delta > 0.0005) invalidate();
  });
  return (
    <group
      ref={ref}
      name={name}
      position={assembled}
      userData={{
        assembled,
        exploded,
        phase,
        ...(semanticLayer ? { semanticLayer } : { mechanicalPart: true }),
      }}
    >
      {children}
    </group>
  );
}
export function Screw() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.042, 0.007, 6, 16]} />
        <meshStandardMaterial
          color="#8d8d8d"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.033, 0.026, 0.026, 16]} />
        <meshStandardMaterial
          color="#696969"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <Block
        position={[0, 0.014, 0]}
        size={[0.041, 0.003, 0.006]}
        color="#141414"
      />
    </group>
  );
}
export function CircuitTile({
  width = 0.7,
  depth = 0.55,
  pins = 6,
}: {
  width?: number;
  depth?: number;
  pins?: number;
}) {
  return (
    <group>
      <Block size={[width, 0.075, depth]} color="#303030" />
      <Block
        position={[0, 0.041, 0]}
        size={[width * 0.76, 0.008, depth * 0.75]}
        color="#1b1b1b"
      />
      {[-1, 1].flatMap((side) =>
        Array.from({ length: pins }, (_, i) => (
          <Block
            key={`${side}-${i}`}
            position={[
              (i - (pins - 1) / 2) * (width / (pins + 1)),
              0.005,
              side * (depth / 2 + 0.04),
            ]}
            size={[0.024, 0.018, 0.1]}
            color="#929292"
          />
        )),
      )}
      <Block
        position={[-width * 0.25, 0.05, -depth * 0.23]}
        size={[0.028, 0.006, 0.028]}
        color="#a6a6a6"
      />
    </group>
  );
}
export function Socket({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.09, z]}>
      <Block size={[0.31, 0.23, 0.2]} color="#242424" />
      <mesh position={[0, 0, 0.107]}>
        <torusGeometry args={[0.075, 0.016, 8, 24]} />
        <meshStandardMaterial
          color="#939393"
          metalness={0.85}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0, 0, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.061, 0.061, 0.01, 20]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    </group>
  );
}
