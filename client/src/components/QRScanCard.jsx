import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import InfoHeader from './InfoHeader.jsx';
import Quagga from '@ericblade/quagga2';

export default function QRScanCard({ onMealLogged }) {
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const detectedRef = useRef(false);

  function startScanner() {
    setError('');
    setResult(null);
    setSaved(false);
    detectedRef.current = false;
    setScanning(true);
  }

  // Initialize Quagga when scanning starts
  useEffect(() => {
    if (!scanning || !scannerRef.current) return;

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        area: { top: '20%', right: '10%', left: '10%', bottom: '20%' },
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'],
        multiple: false,
      },
      locate: true,
      frequency: 10,
    }, (err) => {
      if (err) {
        console.error('Quagga init error:', err);
        setError('Could not access camera: ' + (err.message || err));
        setScanning(false);
        return;
      }
      Quagga.start();
    });

    function onDetected(data) {
      if (detectedRef.current) return;
      const code = data.codeResult?.code;
      if (!code) return;

      detectedRef.current = true;
      Quagga.stop();
      setScanning(false);
      handleBarcode(code);
    }

    Quagga.onDetected(onDetected);

    return () => {
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
  }, [scanning]);

  async function handleBarcode(code) {
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

  function stopScanner() {
    try { Quagga.stop(); } catch {}
    detectedRef.current = false;
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
    return () => { try { Quagga.stop(); } catch {} };
  }, []);

  return (
    <div className="bg-[#080808] border border-white/[0.06] rounded-xl p-6 sm:p-8">
      <InfoHeader title="Barcode Scan" description="Scan a product barcode with your camera to instantly look up nutrition info from the package." />

      {/* Idle state */}
      {!scanning && !looking && !result && !saved && (
        <div className="space-y-4 py-3">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border border-white/[0.08] rounded-full p-2 flex items-center justify-center">
              <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
              </svg>
            </div>
            <button
              onClick={startScanner}
              className="text-[10px] uppercase tracking-[0.15em] border border-primary-500 text-primary-500 px-5 py-2 hover:bg-primary-500 hover:text-black transition-all duration-300"
            >
              SCAN
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Or type barcode number"
              className="flex-1 bg-transparent border-b border-white/[0.1] text-white py-2 text-xs focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
            />
            <button
              onClick={() => { if (manualCode.trim()) { setLooking(true); handleBarcode(manualCode.trim()); setManualCode(''); } }}
              disabled={!manualCode.trim()}
              className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30 shrink-0"
            >
              Look Up
            </button>
          </div>
        </div>
      )}

      {/* Scanning — Quagga renders its own video here */}
      {scanning && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: '300px' }}>
            <div ref={scannerRef} className="w-full" style={{ minHeight: '300px' }} />
            {/* Alignment guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative w-[80%] h-[140px] border-2 border-primary-500/70 bg-transparent z-10" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }}>
                <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-primary-500" />
                <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-primary-500" />
                <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-primary-500" />
                <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-primary-500" />
                <div className="absolute left-2 right-2 h-[2px] bg-primary-500/80 animate-scan-sweep shadow-[0_0_8px_rgba(255,170,0,0.4)]" />
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-[0.15em] text-white/60 z-20">Hold steady — scanning automatically</p>
          </div>
          <button
            onClick={stopScanner}
            className="w-full text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 py-2 transition-colors duration-300"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Or type barcode number"
              className="flex-1 bg-transparent border-b border-white/[0.1] text-white py-2 text-xs focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
            />
            <button
              onClick={() => { if (manualCode.trim()) { stopScanner(); handleBarcode(manualCode.trim()); setManualCode(''); } }}
              disabled={!manualCode.trim()}
              className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-300 disabled:opacity-30 shrink-0"
            >
              Look Up
            </button>
          </div>
        </div>
      )}

      {/* Looking up */}
      {looking && (
        <div className="py-8">
          <div className="w-full h-px bg-white/[0.04] overflow-hidden mb-4">
            <div className="h-full bg-primary-500 animate-scan-line" />
          </div>
          <p className="text-xs text-white/40 text-center">Looking up product...</p>
        </div>
      )}

      {error && !result && (
        <div className="py-4">
          <p className="text-xs text-red-400 mb-3">{error}</p>
          <button onClick={() => { setError(''); }} className="text-[10px] uppercase tracking-[0.15em] text-primary-500/50 hover:text-primary-500 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-4">
            {result.imageUrl && (
              <img src={result.imageUrl} alt="" className="w-16 h-16 object-contain rounded bg-white/5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-display">{result.name}</p>
              {result.brand && <p className="text-xs text-white/40">{result.brand}</p>}
              <p className="text-[10px] text-white/20 tracking-wide mt-1">Per {result.servingSize}</p>
            </div>
            <span className="text-sm text-primary-500 font-display tabular-nums">{result.calories} cal</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-white/30">
            <span>Protein: {result.protein}g</span>
            <span>Carbs: {result.carbs}g</span>
            <span>Fat: {result.fat}g</span>
          </div>
          <button
            onClick={logResult}
            disabled={saving}
            className="w-full py-2.5 text-xs uppercase tracking-[0.15em] bg-primary-500 text-black hover:bg-primary-400 transition-all duration-300 disabled:opacity-40"
          >
            {saving ? 'Logging...' : 'Log This Food'}
          </button>
        </div>
      )}

      {saved && (
        <p className="text-xs text-primary-500/60 text-center py-4">Food logged successfully.</p>
      )}
    </div>
  );
}
