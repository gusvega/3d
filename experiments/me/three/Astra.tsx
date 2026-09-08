import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Line } from "@react-three/drei";
import { narrative, smooth } from "@/lib/timeline";
import { Plate, Block, Label, Encoder, Keybed, Display } from "./Hardware";
import { engines } from "@/data/content";
function AstraSurface() {
  return (
    <group>
      <Plate width={8.1} depth={1.65} color="#2e2e2e" />
      <Label
        text="A S T R A"
        position={[-2.83, 0.067, -0.51]}
        width={1.3}
        height={0.19}
      />
      <group position={[-2.54, 0.09, 0.12]} scale={0.54}>
        <Display astra />
      </group>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[-0.68 + i * 0.99, 0, 0]}>
          <Label
            text={`LUMEN ${["I", "II", "III", "IV"][i]}`}
            position={[0, 0.067, -0.51]}
            width={0.68}
            height={0.1}
          />
          <Encoder position={[-0.16, 0.065, 0.02]} />
          <Encoder position={[0.19, 0.065, 0.47]} />
        </group>
      ))}
      <Encoder position={[3.56, 0.07, 0.15]} large />
      <Label
        text="MASTER"
        position={[3.55, 0.067, -0.5]}
        width={0.55}
        height={0.09}
      />
    </group>
  );
}
function EngineModule({ name }: { name: string }) {
  return (
    <group>
      <Plate width={1.75} depth={1.16} color="#343434" thickness={0.06} />
      <Block position={[0, 0.08, 0]} size={[0.83, 0.1, 0.69]} color="#101010" />
      <Label text={name} position={[0, 0.133, 0]} width={0.67} height={0.12} />
    </group>
  );
}
export default function Astra() {
  const root = useRef<Group>(null),
    surface = useRef<Group>(null),
    base = useRef<Group>(null),
    keyboard = useRef<Group>(null),
    modules = useRef<(Group | null)[]>([]),
    routing = useRef<Group>(null);
  useFrame(() => {
    if (!root.current) return;
    root.current.visible = narrative.chapter === 4;
    if (!root.current.visible) return;
    const p = narrative.local;
    const e =
      (narrative.reduced
        ? 0.4
        : smooth(p / 0.38) * (1 - smooth((p - 0.7) / 0.3))) *
      (narrative.mobile ? 0.64 : 1);
    surface.current!.position.y = 0.26 + e * 1.65;
    base.current!.position.y = -0.3 - e * 0.65;
    keyboard.current!.position.y = 0.15 - e * 0.65;
    modules.current.forEach((m, i) => {
      if (m) {
        m.position.y = i < 4 ? -0.02 + e * 0.66 : -0.12 - e * 0.08;
        m.position.x = i < 4 ? (i - 1.5) * (1.89 + e * 0.03) : (i - 4.5) * 3.3;
        m.position.z = i < 4 ? -0.9 : 0.25 - e * 0.1;
        const selected = narrative.astraSelection === i;
        m.scale.setScalar(1);
        if (selected && e > 0.1) m.position.z += e * 0.12;
      }
    });
    routing.current!.visible = e > 0.15;
  });
  return (
    <group ref={root} visible={false}>
      <group ref={surface} position={[0, 0.26, -0.83]}>
        <AstraSurface />
      </group>
      <group ref={keyboard} position={[0.2, 0.15, 0.87]}>
        <Keybed />
      </group>
      {engines.map(([name], i) => (
        <group
          key={name}
          ref={(el) => {
            modules.current[i] = el;
          }}
        >
          {i < 4 ? (
            <EngineModule name={name} />
          ) : (
            <group>
              <Plate width={3.12} depth={0.55} thickness={0.06} />
              <Label
                text={name + " / PROCESSING"}
                position={[0, 0.035, 0]}
                width={1.5}
                height={0.12}
              />
            </group>
          )}
        </group>
      ))}
      <group ref={base}>
        <Plate width={8.15} depth={3.4} thickness={0.2} color="#171717" />
        <Block
          position={[0, 0.15, 1.62]}
          size={[8.12, 0.27, 0.12]}
          color="#292929"
        />
        <Block position={[0, 0.19, -1.64]} size={[8.12, 0.3, 0.12]} />
        {[-4.12, 4.12].map((x) => (
          <Block
            key={x}
            position={[x, 0.24, 0]}
            size={[0.17, 0.64, 3.42]}
            color="#464646"
          />
        ))}
        <Block
          position={[-3.84, 0.4, 0.8]}
          size={[0.27, 0.02, 1.22]}
          color="#080808"
        />
      </group>
      <group ref={routing}>
        {[0, 1, 2, 3].map((i) => (
          <Line
            key={i}
            points={[
              [(i - 1.5) * 1.92, 0.65, -0.9],
              [(i - 1.5) * 1.92, -0.08, -0.9],
              [(i - 1.5) * 1.1, -0.08, 0.2],
            ]}
            color="#727272"
            lineWidth={0.65}
          />
        ))}
      </group>
    </group>
  );
}
