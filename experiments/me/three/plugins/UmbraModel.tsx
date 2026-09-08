"use client";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  AnimationMixer,
  LoopOnce,
  Mesh,
  MeshPhysicalMaterial,
  PMREMGenerator,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Blender-authored rigid assemblies; scrub the exported animation with native scroll. */
export default function UmbraModel({
  spread,
  onReady,
}: {
  spread: number;
  onReady: (ready: boolean) => void;
}) {
  const { size, invalidate, gl, scene: world } = useThree();
  const file =
    size.width < 600
      ? "/me/models/umbra-blender-mobile.glb"
      : "/me/models/umbra-blender-desktop.glb";
  const gltf = useGLTF(file);
  const instance = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((node) => {
      if (
        node instanceof Mesh &&
        node.material instanceof MeshPhysicalMaterial &&
        node.material.transmission > 0
      ) {
        node.material = node.material.clone();
        node.material.transmission = 0;
        node.material.transparent = true;
        node.material.opacity = 0.06;
        node.material.depthWrite = false;
      }
    });
    return root;
  }, [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(instance), [instance]);
  const clip = gltf.animations.find((a) => a.name === "Explode")!;
  useEffect(() => {
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    onReady(true);
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(instance);
      onReady(false);
    };
  }, [mixer, clip, instance, onReady]);
  useEffect(() => {
    mixer.setTime(Math.min(spread, 0.999999) * clip.duration);
    invalidate();
  }, [spread, mixer, clip, invalidate]);
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    const previous = world.environment;
    world.environment = target.texture;
    invalidate();
    return () => {
      world.environment = previous;
      target.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, world, invalidate]);
  useEffect(
    () => () => {
      instance.traverse((node) => {
        if (
          node instanceof Mesh &&
          node.material instanceof MeshPhysicalMaterial &&
          node.material.transparent &&
          node.material.opacity === 0.06
        )
          node.material.dispose();
      });
    },
    [instance],
  );
  return (
    <group scale={size.width < 600 ? 18 : 16} position={[0, -2.2, 0]}>
      <primitive object={instance} dispose={null} />
    </group>
  );
}
