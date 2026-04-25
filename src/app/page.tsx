"use client";

import { useEffect, useRef, useState } from "react";
import { hasSupabaseConfig } from "@/lib/supabase";

type CaptureState = "idle" | "camera-ready" | "queued";

const jobs = [
  ["Guided scan", "Phone video/photos captured in browser"],
  ["Reconstruction", "Server job creates reference scene"],
  ["Object pass", "Equipment becomes movable assets"],
  ["Layout", "Top-down planning with dimensions"],
];

const equipment = [
  { label: "Range", x: 26, y: 34, w: 118, h: 72 },
  { label: "Prep", x: 186, y: 54, w: 96, h: 96 },
  { label: "Sink", x: 330, y: 42, w: 116, h: 70 },
  { label: "Cooler", x: 92, y: 186, w: 158, h: 88 },
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState("");

  async function startCamera() {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("camera-ready");
    } catch {
      setError("Camera access failed. Use HTTPS or localhost and allow camera permissions.");
    }
  }

  function queueScan() {
    setState("queued");
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <div className="panel intro">
          <p className="eyebrow">Prompt to live kitchen planner</p>
          <h1>Scan a kitchen. Move the equipment. Test the layout.</h1>
          <p className="lede">
            A web-first capture and planning system for restaurant spaces. The scan is the
            reference; equipment becomes editable objects with dimensions, labels, and placement.
          </p>

          <div className="steps">
            {jobs.map(([title, text]) => (
              <div className="step" key={title}>
                <strong>{title}</strong>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="panel capture">
          <div className="videoWrap">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="reticle" />
          </div>
          <div className="captureBar">
            <button className="button" onClick={startCamera}>
              Start phone camera
            </button>
            <button className="button secondary" disabled={state === "idle"} onClick={queueScan}>
              Queue scan
            </button>
            <span className="status">
              {error ||
                (state === "queued"
                  ? "Queued for reconstruction"
                  : state === "camera-ready"
                    ? "Camera ready"
                    : "Waiting for capture")}
            </span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="layoutGrid panel" aria-label="Editable equipment layout">
          {equipment.map((item) => (
            <div
              className="equipment"
              key={item.label}
              style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="panel queue">
          <h2>System wiring</h2>
          <div className="queueItem">
            <strong>Supabase</strong>
            <span>{hasSupabaseConfig ? "Configured" : "Needs anon key"}</span>
          </div>
          <div className="queueItem">
            <strong>GitHub</strong>
            <span>Ready after remote is added</span>
          </div>
          <div className="queueItem">
            <strong>Vercel</strong>
            <span>CLI authenticated</span>
          </div>
        </div>
      </section>
    </main>
  );
}
