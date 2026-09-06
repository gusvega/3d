"use client";
import { useEffect, useState } from "react";

export default function AudioOutput({
  sessionRef,
  volume,
  interrupted,
  onResume,
}) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setLevel(sessionRef.current?.outputLevel || 0),
      150,
    );
    return () => clearInterval(timer);
  }, [sessionRef]);
  const db = level > 0.0001 ? Math.round(20 * Math.log10(level)) : null;
  return (
    <div className="audio-output">
      <div className="output-reading">
        <span>
          {!volume
            ? "Output muted"
            : interrupted
              ? "Audio interrupted"
              : "Speaker signal"}
        </span>
        <span aria-label="Speaker signal level">
          {db === null ? "—" : `${db} dB`}
        </span>
      </div>
      <div className="output-meter" aria-hidden="true">
        <span
          style={{
            width: `${Math.min(100, Math.max(0, ((db ?? -60) + 60) / 60) * 100)}%`,
          }}
        />
      </div>
      {!volume || interrupted ? (
        <button onClick={onResume}>Resume sound</button>
      ) : null}
      <details className="sound-help">
        <summary>No sound?</summary>
        <p>
          Play the demo or an audio file to hear sound. A moving speaker meter
          means the app is sending audio to your browser’s selected output.
          Check that the tab is unmuted and the correct speakers, headphones, or
          audio interface are selected in your system sound settings.
        </p>
        <button onClick={onResume}>Resume sound</button>
      </details>
    </div>
  );
}
