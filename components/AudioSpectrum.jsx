"use client";
import { useEffect, useRef } from "react";

export default function AudioSpectrum({ sessionRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const bars = new Float32Array(40);
    let frame,
      last = 0;
    function draw(now) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - last < 1000 / 30) return;
      last = now;
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio, 2);
      if (
        canvas.width !== Math.round(width * ratio) ||
        canvas.height !== Math.round(height * ratio)
      ) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const audio = sessionRef.current;
      if (audio?.active)
        audio.analyser.getByteFrequencyData(audio.frequencyData);
      const data = audio?.frequencyData;
      for (let i = 0; i < bars.length; i++) {
        let value = 0;
        if (audio?.active && data) {
          const hz = 40 * Math.pow(10000 / 40, i / bars.length);
          const index = Math.min(
            data.length - 1,
            Math.max(
              1,
              Math.floor((hz / (audio.ctx.sampleRate / 2)) * data.length),
            ),
          );
          value = data[index] / 255;
        }
        bars[i] += (value - bars[i]) * (value > bars[i] ? 0.65 : 0.18);
        const x = (i * width) / bars.length,
          barHeight = Math.max(2, bars[i] * (height - 4));
        context.fillStyle = audio?.active ? "#c9e7bd" : "#34413f";
        context.beginPath();
        context.roundRect(
          x,
          height - barHeight,
          Math.max(2, width / bars.length - 3),
          barHeight,
          1.5,
        );
        context.fill();
      }
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [sessionRef]);
  return (
    <div className="spectrum-wrap">
      <div className="spectrum-label">
        <span>Live spectrum</span>
        <span>40 Hz — 10 kHz</span>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Live audio frequency spectrum"
        role="img"
      />
    </div>
  );
}
