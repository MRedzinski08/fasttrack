import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

export default function QRScanCard({ onMealLogged }) {
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const canvasRef = useRef(document.createElement('canvas'));

  function startScanner() {
    setError('');
    setResult(null);
    setSaved(false);
    setScanning(true);
  }

  // Attach camera when video element mounts
  const videoCallbackRef = useCallback(async (node) => {
    videoRef.current = node;
    if (!node) return;
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      node.srcObject = stream;
      scanningRef.current = true;
    } catch {
      setError('Could not access camera. Please allow camera permissions.');
      setScanning(false);
    }
  }, []);

  // Scan frames for barcodes
  useEffect(() => {
    if (!scanning) return;

    let detector = null;
    let intervalId = null;

    // Use BarcodeDetector API if available (Chrome 83+)
    if ('BarcodeDetector' in window) {
      detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    }

    async function scanFrame() {
      if (!scanningRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            handleBarcode(barcodes[0].rawValue);
          }
        } catch {}
      } else {
        // Fallback: capture frame and try to decode with html5-qrcode
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const canvas = canvasRef.current;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const file = await (await fetch(dataUrl)).blob();
          const imageFile = new File([file], 'frame.png', { type: 'image/png' });
          const result = await Html5Qrcode.scanFile(imageFile, false);
          if (result) handleBarcode(result);
        } catch {}
      }
    }

    intervalId = setInterval(scanFrame, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [scanning]);

  async function handleBarcode(code) {
    scanningRef.current = false;
    stopCamera();
    setScanning(false);
    setLooking(true);

    try {
      const data = await api.barcode.lookup(code);
      if (data.found) {
        setResult(data.food);
      } else {
        setError(`Product not found for barcode: ${code}`);
      }
    } catch {
      setError('Failed to look up barcode.');
    } finally {
      setLooking(false);
    }
  }

  function stopCamera() {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function logResult() {
    if (!result) return;
    setSaving(true);
    try {
      await api.meals.log({
        foodName: result.brand ? `${result.name} (${result.brand})` : result.name,
        calories: result.calories,
        proteinG: result.protein,
        carbsG: result.carbs,
        fatG: result.fat,
        quantity: 1,
        unit: result.servingSize,
      });
      setSaved(true);
      setResult(null);
      if (onMealLogged) onMealLogged();
    } catch {
      setError('Failed to log food.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 sm:p-8">
      {/* Header */}
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-display block mb-2">BARCODE SCAN</span>
      <p className="text-xs text-white/30 mb-6 leading-relaxed">Scan a product barcode with your camera to instantly look up nutrition info from the package.</p>

      {/* Idle state */}
      {!scanning && !looking && !result && !saved && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border border-white/[0.08] rounded-full p-4 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          </div>
          <p className="text-sm text-white/40 mb-6">Scan a barcode on food packaging to instantly log nutritional info.</p>
          <button
            onClick={startScanner}
            className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-6 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300"
          >
            SCAN
          </button>
        </div>
      )}

      {/* Scanning */}
      {scanning && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full object-cover" style={{ minHeight: '250px' }} />
            {/* Scanning line overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-4 right-4 h-[2px] bg-primary-500/80 animate-scan-sweep shadow-[0_0_8px_rgba(255,170,0,0.4)]" />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-[0.15em] text-white/40">Point camera at a barcode</p>
          </div>
          <button
            onClick={stopCamera}
            className="w-full text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 py-2 transition-colors duration-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Looking up */}
      {looking && (
        <div className="py-8">
          <div className="w-full h-px bg-white/[0.04] overflow-hidden mb-4">
            <div className="h-full bg-primary-500 animate-scan-line" />
          </div>
          <p className="text-xs text-white/30 text-center">Looking up product...</p>
        </div>
      )}

      {/* Product found */}
      {result && (
        <div className="space-y-4">
          <div className="py-4">
            <div className="w-full h-[2px] bg-primary-500/40 mb-4" />
            <div className="flex items-start gap-4">
              {result.imageUrl && (
                <img src={result.imageUrl} alt={result.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm text-white/70">{result.name}</p>
                {result.brand && <p className="text-xs text-white/30 mt-1">{result.brand}</p>}
                <p className="text-[10px] text-white/20 tracking-wide mt-1">Per {result.servingSize}</p>
              </div>
              <span className="text-sm text-primary-500 font-display tabular-nums">{result.calories} cal</span>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-white/30">
              <span>P: {result.protein}g</span>
              <span>C: {result.carbs}g</span>
              <span>F: {result.fat}g</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={logResult}
              disabled={saving}
              className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-6 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-40"
            >
              {saving ? 'Logging...' : 'LOG'}
            </button>
            <button
              onClick={() => { setResult(null); startScanner(); }}
              className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 px-4 py-2 transition-colors duration-300"
            >
              Scan Again
            </button>
          </div>
        </div>
      )}

      {/* Saved */}
      {saved && (
        <div className="text-center py-8">
          <p className="text-primary-500 text-sm font-display mb-4">&#10003; Logged</p>
          <button
            onClick={() => setSaved(false)}
            className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            Scan Another
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-500/20 text-red-400 text-sm px-4 py-3 mt-4">{error}</div>
      )}
    </div>
  );
}
