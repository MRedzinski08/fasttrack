import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const glassStyle = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(10px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
};

export default function QRScanCard() {
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
    <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
      <CardContent className="py-6">
        <h3 className="text-xl font-medium text-primary-50 mb-4">Barcode Scanner</h3>

        {!scanning && !looking && !result && !saved && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
              </svg>
            </div>
            <p className="text-sm text-white/50 mb-4">Scan a barcode on food packaging to instantly log nutritional info.</p>
            <Button onClick={startScanner} className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium">
              Scan Code
            </Button>
          </div>
        )}

        {scanning && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl" style={{ minHeight: '250px' }} />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary-500/50 rounded-lg" />
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/60">Point camera at a barcode</p>
            </div>
            <Button onClick={stopCamera} variant="outline" className="w-full border-white/10 text-white/60 hover:bg-white/10">
              Cancel
            </Button>
          </div>
        )}

        {looking && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/50">Looking up product...</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-start gap-4">
                {result.imageUrl && (
                  <img src={result.imageUrl} alt={result.name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="text-base font-medium text-primary-50">{result.name}</p>
                  {result.brand && <p className="text-sm text-white/40">{result.brand}</p>}
                  <p className="text-xs text-white/30 mt-1">Per {result.servingSize}</p>
                </div>
                <span className="text-lg font-medium text-[#B8A860]">{result.calories} kcal</span>
              </div>
              <div className="flex gap-4 mt-3 text-sm text-white/50">
                <span>P: {result.protein}g</span>
                <span>C: {result.carbs}g</span>
                <span>F: {result.fat}g</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={logResult} disabled={saving} className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium">
                {saving ? 'Logging...' : 'Log This'}
              </Button>
              <Button onClick={() => { setResult(null); startScanner(); }} variant="outline" className="border-white/10 text-white/60 hover:bg-white/10">
                Scan Again
              </Button>
            </div>
          </div>
        )}

        {saved && (
          <div className="text-center py-6">
            <p className="text-lg text-green-500 font-medium mb-2">Food logged!</p>
            <Button onClick={() => setSaved(false)} variant="outline" className="border-white/10 text-white/60 hover:bg-white/10">
              Scan Another
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}
