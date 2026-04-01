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

export default function PhotoLogCard() {
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
    } catch {
      setError('Failed to log foods.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-2 border-white/20 rounded-2xl" style={glassStyle}>
      <CardContent className="py-6">
        <h3 className="text-xl font-medium text-primary-50 mb-4">Photo Logging</h3>

        {!cameraActive && !analyzing && !results && !saved && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/50 mb-4">Snap a photo of your meal and let AI identify the food and estimate calories.</p>
            <Button onClick={startCamera} className="bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium">
              Take Photo
            </Button>
          </div>
        )}

        {cameraActive && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video ref={videoCallbackRef} autoPlay playsInline muted className="w-full rounded-xl" />
            </div>
            <div className="flex gap-3">
              <Button onClick={captureAndAnalyze} className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium">
                Capture & Analyze
              </Button>
              <Button onClick={stopCamera} variant="outline" className="border-white/10 text-white/60 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/50">Analyzing your meal...</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <p className="text-sm text-white/50">AI identified {results.length} item{results.length !== 1 ? 's' : ''}:</p>
            <div className="space-y-2">
              {results.map((food, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-primary-50 capitalize">{food.name}</p>
                    <p className="text-xs text-white/40">{food.serving} · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                  </div>
                  <span className="text-sm font-medium text-[#B8A860]">{food.calories} kcal</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={logResults} disabled={saving} className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium">
                {saving ? 'Logging...' : 'Log All'}
              </Button>
              <Button onClick={() => { setResults(null); startCamera(); }} variant="outline" className="border-white/10 text-white/60 hover:bg-white/10">
                Retake
              </Button>
            </div>
          </div>
        )}

        {saved && (
          <div className="text-center py-6">
            <p className="text-lg text-green-500 font-medium mb-2">Meal logged!</p>
            <Button onClick={() => setSaved(false)} variant="outline" className="border-white/10 text-white/60 hover:bg-white/10">
              Take Another Photo
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
