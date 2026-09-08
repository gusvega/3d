import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  SRGBColorSpace,
  Matrix4,
  type InstancedMesh,
} from "three";
import { RoundedBox } from "@react-three/drei";

type Vec3 = [number, number, number];
export function Block({
  position = [0, 0, 0],
  size,
  color = "#242424",
  metal = 0.45,
}: {
  position?: Vec3;
  size: Vec3;
  color?: string;
  metal?: number;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={0.48} />
    </mesh>
  );
}
export function Plate({
  width = 6.4,
  depth = 3.35,
  color = "#303030",
  thickness = 0.12,
}: {
  width?: number;
  depth?: number;
  color?: string;
  thickness?: number;
}) {
  return (
    <RoundedBox args={[width, thickness, depth]} radius={0.045} smoothness={3}>
      <meshStandardMaterial color={color} metalness={0.58} roughness={0.39} />
    </RoundedBox>
  );
}
function useArtwork(
  draw: (ctx: CanvasRenderingContext2D) => void,
  width = 1536,
  height = 768,
) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    draw(c.getContext("2d")!);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [draw, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
export function Label({
  text,
  position = [0, 0, 0],
  width = 1.5,
  height = 0.16,
}: {
  text: string;
  position?: Vec3;
  width?: number;
  height?: number;
}) {
  const draw = useMemo(
    () => (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#c5c5c5";
      ctx.font = "500 44px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 384, 48);
    },
    [text],
  );
  const texture = useArtwork(draw, 768, 96);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
export function Encoder({
  position = [0, 0, 0],
  large = false,
}: {
  position?: Vec3;
  large?: boolean;
}) {
  const r = large ? 0.235 : 0.125;
  return (
    <group position={position}>
      <mesh position={[0, 0.023, 0]}>
        <cylinderGeometry args={[r + 0.025, r + 0.025, 0.035, 32]} />
        <meshStandardMaterial
          color="#4d4d4d"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.108, 0]}>
        <cylinderGeometry args={[r * 0.96, r, 0.15, 40]} />
        <meshStandardMaterial
          color="#161616"
          metalness={0.38}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.187, 0]}>
        <cylinderGeometry args={[r * 0.91, r * 0.91, 0.012, 40]} />
        <meshStandardMaterial
          color="#363636"
          metalness={0.62}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.195, -r * 0.52]}>
        <boxGeometry args={[0.018, 0.006, r * 0.42]} />
        <meshBasicMaterial color="#e0e0e0" />
      </mesh>
    </group>
  );
}
function panelArtwork(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#242424";
  ctx.fillRect(0, 0, 1536, 768);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, 1476, 708);
  ctx.fillStyle = "#ddd";
  ctx.font = "500 27px Arial";
  ctx.fillText("G U S   V E G A", 86, 95);
  ctx.fillStyle = "#aaa";
  ctx.font = "15px monospace";
  ctx.fillText("CREATIVE SYSTEM", 1050, 89);
  ctx.fillText("GV—001", 1320, 89);
  ctx.strokeStyle = "#626262";
  ctx.beginPath();
  ctx.moveTo(86, 130);
  ctx.lineTo(1450, 130);
  ctx.stroke();
  ctx.fillStyle = "#999";
  ctx.font = "14px monospace";
  ctx.fillText("SOUND / SPACE / MOVEMENT", 100, 422);
  ctx.fillText("MASTER", 1258, 421);
  const names = ["ENGINE", "TIMBRE", "SHAPE", "SPACE", "MOTION", "LEVEL"];
  ctx.textAlign = "center";
  names.forEach((name, i) => {
    ctx.fillStyle = "#b9b9b9";
    ctx.fillText(name, 181 + i * 235, 684);
    ctx.fillStyle = "#666";
    ctx.fillText("0" + (i + 1), 181 + i * 235, 503);
  });
  ctx.textAlign = "left";
}
export function Display({ astra = false }: { astra?: boolean }) {
  const draw = useMemo(
    () => (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, 1024, 384);
      ctx.fillStyle = "#aaa";
      ctx.font = "18px monospace";
      ctx.fillText(astra ? "ASTRA / FOUR LAYERS" : "01 / OPEN HORIZON", 36, 44);
      ctx.fillText("120.00", 868, 44);
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(36, 67);
      ctx.lineTo(988, 67);
      ctx.stroke();
      ctx.strokeStyle = "#d5d5d5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 920; i++) {
        const y = 180 + Math.sin(i * 0.034) * Math.sin(i * 0.007) * 54;
        i ? ctx.lineTo(52 + i, y) : ctx.moveTo(52 + i, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#919191";
      ctx.font = "15px monospace";
      ctx.fillText("LAYER 01     STEREO     48.0 kHz", 36, 343);
      ctx.fillText("INIT", 898, 343);
    },
    [astra],
  );
  const texture = useArtwork(draw, 1024, 384);
  return (
    <group>
      <Block size={[3.1, 0.055, 1.18]} color="#101010" />
      <mesh position={[0, 0.029, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.99, 1.08]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
export function ControlSurface() {
  const map = useArtwork(panelArtwork);
  return (
    <group>
      <Plate />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.061, 0]}>
        <planeGeometry args={[6.28, 3.23]} />
        <meshStandardMaterial map={map} metalness={0.45} roughness={0.5} />
      </mesh>
      <group position={[-0.78, 0.075, -0.47]}>
        <Display />
      </group>
      <Encoder position={[2.16, 0.07, -0.46]} large />
      {Array.from({ length: 6 }, (_, i) => (
        <Encoder key={i} position={[-2.45 + i * 0.98, 0.07, 0.9]} />
      ))}
      {[-3.01, 3.01].flatMap((x) =>
        [-1.48, 1.48].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.066, z]}>
            <cylinderGeometry args={[0.026, 0.026, 0.008, 10]} />
            <meshStandardMaterial
              color="#999"
              metalness={0.8}
              roughness={0.5}
            />
          </mesh>
        )),
      )}
    </group>
  );
}
function pcbArtwork(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, 1536, 768);
  ctx.strokeStyle = "#535353";
  ctx.lineWidth = 2;
  for (let i = 0; i < 19; i++) {
    ctx.beginPath();
    ctx.moveTo(80 + i * 72, 740);
    ctx.lineTo(80 + i * 72, 530 - (i % 4) * 24);
    ctx.lineTo(110 + i * 72, 490 - (i % 4) * 24);
    ctx.lineTo(110 + i * 72, 60);
    ctx.stroke();
  }
  ctx.fillStyle = "#919191";
  ctx.font = "18px monospace";
  ctx.fillText("GV—A01 / AUDIO PROCESSING", 80, 54);
  ctx.strokeStyle = "#898989";
  ctx.strokeRect(20, 20, 1496, 728);
}
export function DSPBoard({ simple = false }: { simple?: boolean }) {
  const map = useArtwork(pcbArtwork);
  return (
    <group>
      <Block size={[6, 0.055, 3]} color="#181818" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.029, 0]}>
        <planeGeometry args={[5.98, 2.98]} />
        <meshStandardMaterial map={map} metalness={0.25} roughness={0.72} />
      </mesh>
      {Array.from({ length: simple ? 4 : 6 }, (_, i) => (
        <group
          key={i}
          position={[
            -2 + (i % 3) * 1.9,
            0.08,
            -0.58 + Math.floor(i / 3) * 1.12,
          ]}
        >
          <Block size={[0.73, 0.1, 0.64]} color="#090909" />
          <Block
            position={[0, 0.055, 0]}
            size={[0.4, 0.01, 0.36]}
            color="#3b3b3b"
          />
        </group>
      ))}
      {Array.from({ length: simple ? 4 : 12 }, (_, i) => (
        <Block
          key={i}
          position={[-2.6 + i * 0.46, 0.06, 1.27]}
          size={[0.18, 0.06, 0.09]}
          color="#909090"
        />
      ))}
    </group>
  );
}
export function AudioIO() {
  return (
    <group>
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i} position={[-1.05 + i * 0.7, 0, 0]}>
          <mesh>
            <circleGeometry args={[0.095, 24]} />
            <meshStandardMaterial color="#020202" />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <torusGeometry args={[0.083, 0.018, 8, 24]} />
            <meshStandardMaterial
              color="#8a8a8a"
              metalness={0.9}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function Keybed() {
  const whites = useRef<InstancedMesh>(null),
    blacks = useRef<InstancedMesh>(null);
  const blackIndices = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => i).filter(
        (i) => ![2, 6].includes(i % 7),
      ),
    [],
  );
  useLayoutEffect(() => {
    const m = new Matrix4();
    for (let i = 0; i < 22; i++)
      whites.current!.setMatrixAt(
        i,
        m.makeTranslation(-3.47 + i * 0.325, 0, 0.0),
      );
    blackIndices.forEach((i, j) =>
      blacks.current!.setMatrixAt(
        j,
        m.makeTranslation(-3.47 + (i + 0.54) * 0.325, 0.098, -0.25),
      ),
    );
    whites.current!.instanceMatrix.needsUpdate = true;
    blacks.current!.instanceMatrix.needsUpdate = true;
  }, [blackIndices]);
  return (
    <group>
      <instancedMesh ref={whites} args={[undefined, undefined, 22]}>
        <boxGeometry args={[0.311, 0.12, 1.35]} />
        <meshStandardMaterial
          color="#d8d8d8"
          metalness={0.04}
          roughness={0.32}
        />
      </instancedMesh>
      <instancedMesh
        ref={blacks}
        args={[undefined, undefined, blackIndices.length]}
      >
        <boxGeometry args={[0.17, 0.14, 0.82]} />
        <meshStandardMaterial color="#111" metalness={0.15} roughness={0.35} />
      </instancedMesh>
    </group>
  );
}
