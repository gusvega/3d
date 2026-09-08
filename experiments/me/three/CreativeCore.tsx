import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Line } from "@react-three/drei";
import { narrative, getPose } from "@/lib/timeline";
import { Plate, ControlSurface, DSPBoard, Block, AudioIO } from "./Hardware";
export default function CreativeCore({ simple = false }: { simple?: boolean }) {
  const root = useRef<Group>(null),
    surface = useRef<Group>(null),
    board = useRef<Group>(null),
    base = useRef<Group>(null),
    left = useRef<Group>(null),
    right = useRef<Group>(null),
    guides = useRef<Group>(null);
  useFrame(() => {
    if (!root.current) return;
    const pose = getPose(narrative.chapter, narrative.local);
    root.current.visible = !pose.astra;
    const e =
      (narrative.reduced
        ? narrative.chapter === 0 || narrative.chapter >= 8
          ? 0
          : 0.38
        : pose.spread) * (narrative.mobile ? 0.68 : 1);
    root.current.rotation.y = narrative.reduced ? 0 : pose.turn;
    surface.current!.position.y = 0.27 + e * 1.35;
    board.current!.position.y = 0.01 + e * 0.24;
    base.current!.position.y = -0.24 - e * 0.85;
    left.current!.position.set(-3.23 - e * 0.58, 0.015, 0);
    right.current!.position.set(3.23 + e * 0.58, 0.015, 0);
    guides.current!.visible = e > 0.12;
  });
  return (
    <group ref={root}>
      <group ref={surface}>
        <ControlSurface />
      </group>
      <group ref={board}>
        <DSPBoard simple={simple} />
      </group>
      <group ref={base}>
        <Plate thickness={0.12} color="#171717" />
        <Block
          position={[0, 0.25, 1.6]}
          size={[6.3, 0.39, 0.11]}
          color="#282828"
        />
        <Block
          position={[0, 0.25, -1.6]}
          size={[6.3, 0.39, 0.11]}
          color="#252525"
        />
        <group position={[0, 0.24, -1.665]} rotation={[0, Math.PI, 0]}>
          <AudioIO />
        </group>
        {[-2.6, 2.6].flatMap((x) =>
          [-1.15, 1.15].map((z) => (
            <Block
              key={`${x}${z}`}
              position={[x, -0.095, z]}
              size={[0.3, 0.09, 0.3]}
              color="#080808"
            />
          )),
        )}
      </group>
      <group ref={left}>
        <Block size={[0.16, 0.53, 3.4]} color="#454545" />
      </group>
      <group ref={right}>
        <Block size={[0.16, 0.53, 3.4]} color="#454545" />
      </group>
      <group ref={guides}>
        {[-2.96, 2.96].flatMap((x) =>
          [-1.41, 1.41].map((z) => (
            <Line
              key={`${x}${z}`}
              points={[
                [x, -1.15, z],
                [x, 1.85, z],
              ]}
              color="#4d4d4d"
              lineWidth={0.6}
              dashed
              dashSize={0.04}
              gapSize={0.1}
            />
          )),
        )}
      </group>
    </group>
  );
}
