"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Group, SRGBColorSpace } from "three";
import { MechanicalPart, Screw, CircuitTile, Socket } from "./Mechanics";
import { Block, Plate } from "../Hardware";
import type { PluginDesign, ModuleSpec } from "@/data/plugin-models";

function SurfaceModule({
  design,
  module,
  index,
  spread,
  selected,
  reduced,
}: {
  design: PluginDesign;
  module: ModuleSpec;
  index: number;
  spread: number;
  selected: number;
  reduced: boolean;
}) {
  const texture = useTexture(`/me/plugins/${design.name.toLowerCase()}.webp`);
  const [x, y, w, h] = module.rect,
    W = 7,
    D = W / design.aspect;
  const face = useMemo(() => {
    const t = texture.clone();
    t.colorSpace = SRGBColorSpace;
    t.repeat.set(w, h);
    t.offset.set(x, 1 - y - h);
    t.needsUpdate = true;
    return t;
  }, [texture, x, y, w, h]);
  useEffect(() => () => face.dispose(), [face]);
  const bx = (x + w / 2 - 0.5) * W,
    bz = (y + h / 2 - 0.5) * D;
  return (
    <MechanicalPart
      name={`${design.name}_${module.name}`}
      assembled={[bx, 0.22, bz]}
      exploded={[bx + (module.axis ?? 0) * 0.65, 0.5 + module.lift * 1.3, bz]}
      phase={[0.28, 0.82]}
      spread={spread}
      reduced={reduced}
      semanticLayer={module.name}
    >
      <Plate
        width={w * W - 0.018}
        depth={h * D - 0.018}
        thickness={0.09}
        color={selected === index ? "#454545" : "#282828"}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.047, 0]}>
        <planeGeometry args={[w * W - 0.023, h * D - 0.023]} />
        <meshBasicMaterial map={face} toneMapped={false} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <MechanicalPart
            key={`${sx}-${sz}`}
            name={`Fastener_${index}_${sx}_${sz}`}
            assembled={[
              sx * ((w * W) / 2 - 0.065),
              0.06,
              sz * ((h * D) / 2 - 0.06),
            ]}
            exploded={[
              sx * ((w * W) / 2 - 0.065),
              0.28,
              sz * ((h * D) / 2 - 0.06),
            ]}
            phase={[0.72, 0.98]}
            spread={spread}
            reduced={reduced}
          >
            <Screw />
          </MechanicalPart>
        )),
      )}
      {design.knobs
        .filter(([kx, ky]) => kx >= x && kx < x + w && ky >= y && ky < y + h)
        .map(([kx, ky], i) => (
          <group
            key={i}
            position={[(kx - x - w / 2) * W, 0.085, (ky - y - h / 2) * D]}
          >
            <mesh>
              <cylinderGeometry args={[0.027, 0.027, 0.14, 12]} />
              <meshStandardMaterial
                color="#a0a0a0"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
              <torusGeometry args={[0.079, 0.009, 6, 20]} />
              <meshStandardMaterial
                color="#777777"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <MechanicalPart
              name={`Encoder_cap_${index}_${i}`}
              assembled={[0, 0, 0]}
              exploded={[0, 0.24, 0]}
              phase={[0.7, 0.98]}
              spread={spread}
              reduced={reduced}
            >
              <mesh>
                <cylinderGeometry args={[0.072, 0.079, 0.075, 20]} />
                <meshStandardMaterial
                  color="#363636"
                  metalness={0.65}
                  roughness={0.33}
                />
              </mesh>
              <Block
                position={[0, 0.04, -0.043]}
                size={[0.008, 0.005, 0.035]}
                color="#c5c5c5"
              />
            </MechanicalPart>
          </group>
        ))}
    </MechanicalPart>
  );
}
export default function PluginAssembly({
  design,
  spread,
  selected,
  reduced,
  modelRef,
  onReady,
}: {
  design: PluginDesign;
  spread: number;
  selected: number;
  reduced: boolean;
  modelRef: React.RefObject<Group | null>;
  onReady: (ready: boolean) => void;
}) {
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  const W = 7,
    D = W / design.aspect;
  return (
    <group
      ref={modelRef}
      name={`${design.name}_exploded_assembly`}
      position={[0, -0.5, 0]}
    >
      <MechanicalPart
        name="Lower_enclosure"
        assembled={[0, -0.27, 0]}
        exploded={[0, -0.9, 0]}
        phase={[0.02, 0.3]}
        spread={spread}
        reduced={reduced}
      >
        <Plate
          width={W + 0.14}
          depth={D + 0.14}
          thickness={0.16}
          color="#222222"
        />
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <group
              key={`${x}-${z}`}
              position={[x * 3.2, 0.13, z * (D / 2 - 0.28)]}
            >
              <mesh>
                <cylinderGeometry args={[0.055, 0.055, 0.24, 12]} />
                <meshStandardMaterial color="#777777" metalness={0.8} />
              </mesh>
              <Screw />
            </group>
          )),
        )}
        {Array.from({ length: 16 }, (_, i) => (
          <Block
            key={i}
            position={[(i - 7.5) * 0.16, 0.084, D / 2 - 0.27]}
            size={[0.06, 0.004, 0.28]}
            color="#080808"
          />
        ))}
      </MechanicalPart>
      {[-1, 1].map((side) => (
        <MechanicalPart
          key={side}
          name={`Machined_side_rail_${side}`}
          assembled={[side * (W / 2 + 0.04), -0.06, 0]}
          exploded={[side * (W / 2 + 0.65), -0.15, 0]}
          phase={[0.02, 0.3]}
          spread={spread}
          reduced={reduced}
        >
          <Block size={[0.09, 0.5, D + 0.12]} color="#3b3b3b" />
          {[-1, 1].map((z) => (
            <group key={z} position={[0, 0.255, z * (D / 2 - 0.16)]}>
              <Screw />
            </group>
          ))}
        </MechanicalPart>
      ))}
      <MechanicalPart
        name="Audio_IO_bus"
        assembled={[0, -0.08, -D / 2 + 0.12]}
        exploded={[0, -0.1, -D / 2 - 0.55]}
        phase={[0.1, 0.42]}
        spread={spread}
        reduced={reduced}
      >
        <Block size={[W - 0.3, 0.27, 0.14]} color="#323232" />
        {[-1.1, -0.65, 0.65, 1.1].map((x) => (
          <group key={x} rotation={[0, Math.PI, 0]}>
            <Socket x={x} z={0} />
          </group>
        ))}
      </MechanicalPart>
      <MechanicalPart
        name="DSP_processing_board"
        assembled={[0, -0.03, 0]}
        exploded={[0, -0.23, 0]}
        phase={[0.12, 0.48]}
        spread={spread}
        reduced={reduced}
      >
        <Block size={[W - 0.28, 0.045, D - 0.25]} color="#171717" />
        {design.modules.map((m, i) => (
          <group
            name={`Processing_${m.name}`}
            key={m.name}
            position={[(i - (design.modules.length - 1) / 2) * 1.05, 0.065, 0]}
          >
            <CircuitTile />
            {Array.from({ length: 4 }, (_, j) => (
              <group key={j} position={[(j - 1.5) * 0.15, 0, 0.57]}>
                <Block size={[0.06, 0.06, 0.12]} color="#676767" />
                <Block
                  position={[0, 0.034, 0]}
                  size={[0.045, 0.006, 0.075]}
                  color="#292929"
                />
              </group>
            ))}
            {[-1, 1].map((side) => (
              <group key={side} position={[0.28, 0.03, side * 0.9]}>
                <mesh>
                  <cylinderGeometry args={[0.055, 0.055, 0.17, 14]} />
                  <meshStandardMaterial color="#424242" metalness={0.5} />
                </mesh>
                <Block
                  position={[0, 0.09, 0]}
                  size={[0.06, 0.004, 0.006]}
                  color="#999999"
                />
              </group>
            ))}
            {Array.from({ length: 4 }, (_, j) => (
              <Block
                key={j}
                size={[0.009, 0.003, D - 0.5]}
                position={[(j - 1.5) * 0.11, -0.039, 0]}
                color="#646464"
              />
            ))}
          </group>
        ))}
      </MechanicalPart>
      {design.modules.map((m, i) => (
        <SurfaceModule
          key={m.name}
          design={design}
          module={m}
          index={i}
          spread={spread}
          selected={selected}
          reduced={reduced}
        />
      ))}
    </group>
  );
}
