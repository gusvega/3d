"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type ReactNode, useEffect, useState } from "react";
const Scene = dynamic(() => import("@/three/Scene"), { ssr: false });
function Fallback() {
  return (
    <div className="core-fallback" aria-hidden="true">
      <Image
        src="/me/images/creative-core.webp"
        width={820}
        height={520}
        alt=""
      />
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
export default function SceneLoader() {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      setAvailable(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setAvailable(false);
    }
  }, []);
  return (
    <div className="scene-container" aria-hidden="true">
      <SceneBoundary>
        {available === true ? <Scene /> : <Fallback />}
      </SceneBoundary>
      <div className="scene-caption">
        <span>GV—001</span>
        <span>CREATIVE SYSTEM / CONCEPT ASSEMBLY</span>
        <span>↗</span>
      </div>
    </div>
  );
}
