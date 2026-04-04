import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import InfoHeader from './InfoHeader.jsx';

export default function PhotoLogCard({ onMealLogged }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function startCamera() {
    setError('');
    setResults(null);
    setSaved(false);
    setCameraActive(true);
  }

  // Attach stream once the video element is mounted
  const videoCallbackRef = useCallback(async (node) => {
    videoRef.current = node;
    if (!node) return;
    try {
      // Try environment camera first, fall back to any camera
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
    } catch {
      setError('Could not access camera. Please allow camera permissions.');
      setCameraActive(false);
    }
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function captureAndAnalyze() {
    if (!videoRef.current) return;
    setAnalyzing(true);
    setError('');

    const canvas = document.createElement('canvas');
    // Scale down to max 800px to reduce payload size
    const maxDim = 800;
    let w = videoRef.current.videoWidth;
    let h = videoRef.current.videoHeight;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, w, h);

    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    stopCamera();

    try {
      const data = await api.photo.analyze(base64);
      if (data.foods && data.foods.length > 0) {
        setResults(data.foods);
      } else {
        setError(data.error || 'Could not identify any food in the photo.');
      }
    } catch (err) {
      setError('Failed to analyze photo: ' + (err.message || 'Please try again.'));
    } finally {
      setAnalyzing(false);
    }
  }

  async function logResults() {
    if (!results) return;
    setSaving(true);
    try {
      for (const food of results) {
        await api.meals.log({
          foodName: food.name,
          calories: food.calories,
          proteinG: food.protein,
          carbsG: food.carbs,
          fatG: food.fat,
          quantity: 1,
          unit: food.serving || 'serving',
        });
      }
      setSaved(true);
      setResults(null);
      if (onMealLogged) onMealLogged();
    } catch {
      setError('Failed to log foods.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 sm:p-8">
      {/* Header */}
      <InfoHeader title="Photo Log" description="Take a photo of your meal and AI will identify the food and estimate calories and macros for you." />

      {/* Idle state */}
      {!cameraActive && !analyzing && !results && !saved && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 border border-white/[0.08] rounded-full p-2 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <button
            onClick={startCamera}
            className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-5 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300"
          >
            CAPTURE
          </button>
        </div>
      )}

      {/* Camera active */}
      {cameraActive && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-black">
            <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={captureAndAnalyze}
              className="flex-1 text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-6 py-2.5 hover:bg-primary-500 hover:text-black transition-all duration-300"
            >
              ANALYZE
            </button>
            <button
              onClick={stopCamera}
              className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 px-4 py-2.5 transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {analyzing && (
        <div className="py-8">
          <div className="w-full h-px bg-white/[0.04] overflow-hidden mb-4">
            <div className="h-full bg-primary-500 animate-scan-line" />
          </div>
          <p className="text-xs text-white/30 text-center">Processing...</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <p className="text-xs text-white/40">{results.length} item{results.length !== 1 ? 's' : ''} identified</p>
          <div className="space-y-3">
            {results.map((food, i) => (
              <div key={i} className="group">
                <div className="w-full h-[2px] bg-primary-500/40 mb-2" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/60 capitalize">{food.name}</p>
                    <p className="text-[10px] text-white/30 tracking-wide mt-1">{food.serving} · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                  </div>
                  <span className="text-xs text-primary-500 tabular-nums">{food.calories} cal</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={logResults}
              disabled={saving}
              className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-6 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-40"
            >
              {saving ? 'Logging...' : 'LOG ALL'}
            </button>
            <button
              onClick={() => { setResults(null); startCamera(); }}
              className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 px-4 py-2 transition-colors duration-300"
            >
              Retake
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
            Take Another Photo
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
