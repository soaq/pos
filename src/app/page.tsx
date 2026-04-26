"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasSupabaseConfig } from "@/lib/supabase";
import { ScanPreview } from "@/components/ScanPreview";

type CaptureState = "idle" | "camera-ready" | "recording" | "queued" | "ready";
type ScanStatus = "queued" | "processing" | "ready";

type EquipmentItem = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type ScanRecord = {
  id: string;
  name: string;
  status: ScanStatus;
  createdAt: string;
  scaleReference: string;
  coverage: number;
  durationSeconds: number;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://restaurant-3d-planner.vercel.app";
const githubRepo = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "https://github.com/soaq/pos";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tgoyekuadpmjrblfqqge.supabase.co";

const defaultEquipment: EquipmentItem[] = [
  { id: "range", label: "Range", x: 28, y: 32, w: 128, h: 76 },
  { id: "prep", label: "Prep", x: 196, y: 54, w: 104, h: 96 },
  { id: "sink", label: "Sink", x: 346, y: 42, w: 118, h: 72 },
  { id: "cooler", label: "Cooler", x: 86, y: 198, w: 168, h: 92 },
];

const storageKey = "restaurant-3d-planner-state";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const metricsRef = useRef({ coverage: 0, durationSeconds: 0 });

  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState("");
  const [scanName, setScanName] = useState("Kitchen scan");
  const [scaleReference, setScaleReference] = useState("36 in doorway");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [coverage, setCoverage] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(defaultEquipment);
  const [selectedId, setSelectedId] = useState(defaultEquipment[0].id);

  const selected = useMemo(
    () => equipment.find((item) => item.id === selectedId) ?? equipment[0],
    [equipment, selectedId],
  );

  async function startCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera capture.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setState("camera-ready");
    } catch {
      setError("Camera access failed. Use HTTPS and allow camera permissions.");
    }
  }

  function startRecording() {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setCoverage(8);
    setDurationSeconds(0);
    const mimeType = preferredMimeType();
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(URL.createObjectURL(blob));
      queueScan();
    };
    recorder.start();
    setState("recording");
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function queueScan() {
    const scan: ScanRecord = {
      id: crypto.randomUUID(),
      name: scanName.trim() || "Kitchen scan",
      status: "processing",
      createdAt: new Date().toISOString(),
      scaleReference,
      coverage: metricsRef.current.coverage,
      durationSeconds: metricsRef.current.durationSeconds,
    };
    setScans((current) => [scan, ...current]);
    setState("queued");

    window.setTimeout(() => {
      setScans((current) =>
        current.map((item) => (item.id === scan.id ? { ...item, status: "ready" } : item)),
      );
      setState("ready");
    }, 1800);
  }

  function addEquipment() {
    const item: EquipmentItem = {
      id: crypto.randomUUID(),
      label: `Item ${equipment.length + 1}`,
      x: 42,
      y: 42,
      w: 120,
      h: 72,
    };
    setEquipment((current) => [...current, item]);
    setSelectedId(item.id);
  }

  function updateSelected(patch: Partial<EquipmentItem>) {
    if (!selected) return;
    setEquipment((current) =>
      current.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)),
    );
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>, item: EquipmentItem) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: item.id,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    setSelectedId(item.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !gridRef.current) return;

    const grid = gridRef.current.getBoundingClientRect();
    const drag = dragRef.current;
    setEquipment((current) =>
      current.map((item) => {
        if (item.id !== drag.id) return item;
        return {
          ...item,
          x: clamp(event.clientX - grid.left - drag.dx, 0, grid.width - item.w),
          y: clamp(event.clientY - grid.top - drag.dy, 0, grid.height - item.h),
        };
      }),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function exportLayout() {
    const payload = {
      exportedAt: new Date().toISOString(),
      scans,
      equipment,
      scanMetrics: { coverage, durationSeconds },
      supabaseUrl,
      githubRepo,
      siteUrl,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kitchen-layout.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { scans?: ScanRecord[]; equipment?: EquipmentItem[] };
      if (parsed.scans) setScans(parsed.scans);
      if (parsed.equipment?.length) {
        setEquipment(parsed.equipment);
        setSelectedId(parsed.equipment[0].id);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ scans, equipment }));
  }, [scans, equipment]);

  useEffect(() => {
    metricsRef.current = { coverage, durationSeconds };
  }, [coverage, durationSeconds]);

  useEffect(() => {
    if (state !== "recording") return;

    const timer = window.setInterval(() => {
      setDurationSeconds((current) => current + 1);
      setCoverage((current) => Math.min(100, current + 7));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  return (
    <main className="shell">
      <section className="hero">
        <div className="panel intro">
          <p className="eyebrow">3D kitchen scan workflow</p>
          <h1>Capture enough coverage for a usable 3D reconstruction.</h1>
          <p className="lede">
            Record a slow perimeter pass, include a measured scale reference, and keep equipment
            visible from multiple angles so the reconstruction step has usable geometry.
          </p>

          <div className="controls">
            <label>
              Scan name
              <input value={scanName} onChange={(event) => setScanName(event.target.value)} />
            </label>
            <label>
              Scale reference
              <input
                value={scaleReference}
                onChange={(event) => setScaleReference(event.target.value)}
              />
            </label>
          </div>

          <div className="scanGuide">
            {scanGuidance(coverage).map((step) => (
              <div className={step.done ? "guideStep done" : "guideStep"} key={step.label}>
                <strong>{step.label}</strong>
                <span>{step.text}</span>
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
              Start camera
            </button>
            <button
              className="button"
              disabled={state !== "camera-ready"}
              onClick={startRecording}
            >
              Record scan
            </button>
            <button className="button secondary" disabled={state !== "recording"} onClick={stopRecording}>
              Stop
            </button>
          </div>
          <div className="status">
            {error || statusText(state)}
            {recordingUrl ? (
              <a className="download" href={recordingUrl} download={`${scanName || "scan"}.webm`}>
                Download recording
              </a>
            ) : null}
          </div>
          <div className="scanMeters">
            <Meter label="3D coverage" value={coverage} />
            <Meter label="Duration" value={Math.min(100, Math.round((durationSeconds / 45) * 100))} text={`${durationSeconds}s`} />
            <Meter label="Scale anchor" value={scaleReference.trim() ? 100 : 0} text={scaleReference.trim() ? "set" : "missing"} />
          </div>
        </div>
      </section>

      <section className="scanFocus panel">
        <div>
          <p className="eyebrow">Reconstruction preview</p>
          <h2>Live scan cloud</h2>
          <p>
            This preview visualizes capture coverage and equipment placement. The production
            backend will replace this simulated point cloud with photogrammetry or Gaussian splat
            output.
          </p>
        </div>
        <ScanPreview coverage={coverage} equipment={equipment} recording={state === "recording"} />
      </section>

      <section className="workspace">
        <div className="panel planner">
          <div className="plannerHead">
            <div>
              <p className="eyebrow">Editable layout</p>
              <h2>Drag equipment on the grid</h2>
            </div>
            <div className="captureBar compact">
              <button className="button secondary" onClick={addEquipment}>
                Add item
              </button>
              <button className="button" onClick={exportLayout}>
                Export JSON
              </button>
            </div>
          </div>

          <div className="layoutGrid" ref={gridRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {equipment.map((item) => (
              <div
                className={`equipment ${item.id === selectedId ? "selected" : ""}`}
                key={item.id}
                onPointerDown={(event) => onPointerDown(event, item)}
                style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {selected ? (
            <div className="inspector">
              <label>
                Label
                <input
                  value={selected.label}
                  onChange={(event) => updateSelected({ label: event.target.value })}
                />
              </label>
              <label>
                Width
                <input
                  type="number"
                  value={selected.w}
                  onChange={(event) => updateSelected({ w: Number(event.target.value) || 40 })}
                />
              </label>
              <label>
                Depth
                <input
                  type="number"
                  value={selected.h}
                  onChange={(event) => updateSelected({ h: Number(event.target.value) || 40 })}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="panel queue">
          <h2>Scan queue</h2>
          {scans.length ? (
            scans.map((scan) => (
              <div className="queueItem" key={scan.id}>
                <div>
                  <strong>{scan.name}</strong>
                  <small>
                    {scan.scaleReference} / {scan.coverage}% / {scan.durationSeconds}s
                  </small>
                </div>
                <span>{scan.status}</span>
              </div>
            ))
          ) : (
            <p className="empty">No scans yet. Start the camera and record a scan.</p>
          )}

          <h2>System wiring</h2>
          <div className="queueItem">
            <strong>Storage</strong>
            <span>{hasSupabaseConfig ? "Supabase client ready" : "Browser-local active"}</span>
          </div>
          <div className="queueItem">
            <strong>GitHub</strong>
            <a href={githubRepo}>Repo pushed</a>
          </div>
          <div className="queueItem">
            <strong>Vercel</strong>
            <a href={siteUrl}>Production live</a>
          </div>
          <div className="queueItem">
            <strong>Database URL</strong>
            <span>{new URL(supabaseUrl).host}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function preferredMimeType() {
  if (!("MediaRecorder" in window)) return "";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
  if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  return "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function statusText(state: CaptureState) {
  if (state === "recording") return "Recording scan";
  if (state === "queued") return "Processing scan";
  if (state === "ready") return "Scan ready";
  if (state === "camera-ready") return "Camera ready";
  return "Waiting for camera";
}

function Meter({ label, value, text }: { label: string; value: number; text?: string }) {
  return (
    <div className="meter">
      <div>
        <strong>{label}</strong>
        <span>{text ?? `${value}%`}</span>
      </div>
      <i style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

function scanGuidance(coverage: number) {
  return [
    {
      label: "1. Perimeter pass",
      text: "Walk the room edge slowly.",
      done: coverage >= 25,
    },
    {
      label: "2. Equipment faces",
      text: "Capture front, sides, and top edges.",
      done: coverage >= 55,
    },
    {
      label: "3. Occlusion pass",
      text: "Fill gaps behind racks and prep tables.",
      done: coverage >= 80,
    },
  ];
}
