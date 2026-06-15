"use client";

import { useEffect, useRef, useState } from "react";

interface Props { onResult: (text: string) => void; onClose: () => void }

export function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!BD) { setErr("This browser has no built-in QR scanner — paste the address instead."); return; }
    const detector = new BD({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) { onResult(codes[0].rawValue); return; } } catch { /* keep scanning */ }
          raf = requestAnimationFrame(scan);
        };
        scan();
      } catch { setErr("Couldn't access the camera."); }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onResult]);

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd glass" onClick={(e) => e.stopPropagation()} style={{ padding: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Scan a QR address</div>
        {err ? <div className="hint bad">{err}</div> : <video ref={videoRef} style={{ width: "100%", borderRadius: 12, background: "#000" }} muted playsInline />}
        <button className="btn btn-block" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
