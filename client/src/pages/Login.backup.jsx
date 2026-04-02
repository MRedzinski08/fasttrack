import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { api } from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const googleProvider = new GoogleAuthProvider();

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const bgRef = useRef(null);

  // Parallax on mouse move with drift
  const cardRef = useRef(null);
  const sunspillRef = useRef(null);
  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function animate() {
      currentX = lerp(currentX, targetX, 0.03);
      currentY = lerp(currentY, targetY, 0.03);

      if (bgRef.current) {
        const layers = bgRef.current.querySelectorAll('[data-parallax]');
        layers.forEach((layer) => {
          const speed = parseFloat(layer.dataset.parallax) * 0.5;
          layer.style.transform = `translate(${currentX * speed}px, ${currentY * speed}px)`;
        });
      }

      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${currentX * -24}px, ${currentY * -24}px)`;
      }

      if (bgRef.current) {
        bgRef.current.querySelectorAll('[data-plx-sun]').forEach((el) => {
          el.style.transform = `translate(${currentX * 4}px, ${currentY * 4}px)`;
        });
        bgRef.current.querySelectorAll('[data-plx-ground]').forEach((el) => {
          el.style.transform = `translate(${currentX * -36}px, ${currentY * -36}px)`;
        });
      }

      const spill = document.getElementById('sunspill');
      if (spill) {
        spill.style.transform = `translate(${currentX * -8}px, ${currentY * -36}px)`;
      }

      rafId = requestAnimationFrame(animate);
    }

    function handleMouseMove(e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    window.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  async function registerAndNavigate(user, name) {
    const result = await api.auth.register({
      firebaseUid: user.uid,
      email: user.email,
      displayName: name || user.displayName || user.email.split('@')[0],
    });
    if (!result.user.onboarding_complete) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await registerAndNavigate(cred.user, displayName);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const me = await api.auth.me();
        if (!me.user.onboarding_complete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await registerAndNavigate(cred.user, cred.user.displayName);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A0800' }}>
      {/* Background scene */}
      <div ref={bgRef} className="absolute inset-0">
        {/* Base gradient */}
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: '-200px',
            background: 'linear-gradient(to bottom, #1A1200 0%, #0A0800 40%, #080600 100%)',
          }}
        />

        {/* Wide ambient glow */}
        <div
          data-plx-sun
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '0%', width: '160%', height: 'calc(36% + 50px)' }}
        >
          <div className="w-full h-full sun-pulse-2" style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(255,160,0,0.3) 0%, rgba(255,130,0,0.1) 30%, transparent 55%)',
            transformOrigin: '50% 100%',
          }} />
        </div>

        {/* Inner glow */}
        <div
          data-plx-sun
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '0%', width: '100%', height: 'calc(36% + 50px)' }}
        >
          <div className="w-full h-full sun-pulse-1" style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(255,190,80,0.45) 0%, rgba(255,150,0,0.2) 20%, rgba(255,140,0,0.08) 35%, transparent 52.5%)',
            transformOrigin: '50% 100%',
          }} />
        </div>

        {/* Bright sun core */}
        <div
          data-plx-sun
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '0%', width: '50%', height: 'calc(36% + 50px)' }}
        >
          <div className="w-full h-full sun-pulse-3" style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(255,250,240,0.9) 0%, rgba(255,220,160,0.5) 5%, rgba(255,170,40,0.25) 15%, transparent 35%)',
            transformOrigin: '50% 100%',
          }} />
        </div>

        {/* Rings — full circles, behind the ground */}
        <div
          data-parallax="96"
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 'calc(36% - 80vw + 960px)', zIndex: 1, filter: 'drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 20px rgba(255,255,255,0.8)) drop-shadow(0 0 50px rgba(255,255,255,0.3))' }}
        >
          <svg style={{ width: '160vw', maxWidth: '2400px', aspectRatio: '1' }} viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="195" stroke="rgba(255,255,255,0.04)" strokeWidth="0.1" />
          </svg>
        </div>

        <div
          data-parallax="64"
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 'calc(36% - 60vw + 790px)', zIndex: 1, filter: 'drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 22px rgba(255,255,255,0.9)) drop-shadow(0 0 55px rgba(255,255,255,0.35))' }}
        >
          <svg style={{ width: '120vw', maxWidth: '1650px', aspectRatio: '1' }} viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="195" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" />
          </svg>
        </div>

        <div
          data-parallax="36"
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 'calc(36% - 37.5vw + 460px)', zIndex: 1, filter: 'drop-shadow(0 0 5px rgba(255,255,255,1)) drop-shadow(0 0 25px rgba(255,255,255,1)) drop-shadow(0 0 60px rgba(255,255,255,0.4))' }}
        >
          <svg style={{ width: '75vw', maxWidth: '1050px', aspectRatio: '1' }} viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="195" stroke="rgba(255,255,255,0.15)" strokeWidth="0.35" />
          </svg>
        </div>

        <div
          data-parallax="16"
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 'calc(36% - 19vw + 235px)', zIndex: 1, filter: 'drop-shadow(0 0 6px rgba(255,255,255,1)) drop-shadow(0 0 28px rgba(255,255,255,1)) drop-shadow(0 0 70px rgba(255,255,255,0.5))' }}
        >
          <svg style={{ width: '38vw', maxWidth: '550px', aspectRatio: '1' }} viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="195" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          </svg>
        </div>

        {/* Horizon ground + sunlight spill — single element for parallax */}
        <div
          data-plx-ground
          className="absolute"
          style={{
            top: 'calc(-50% - 480px)',
            left: '-200px',
            right: '-200px',
            bottom: '-300px',
            zIndex: 2,
            background: 'linear-gradient(to bottom, transparent 0%, transparent 57%, #0A0800 57.1%, #0A0800 100%)',
          }}
        >
        </div>


        {/* Wavy foreground gradient */}
        <div
          data-plx-ground
          className="absolute foreground-wave"
          style={{
            top: 'calc(38% - 70px)',
            left: '-50px',
            right: '-50px',
            bottom: '-50px',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Sunlight spill — same Y as ground, weak X */}
      <div
        id="sunspill"
        className="absolute"
        style={{
          top: 'calc(36% - 42px)',
          left: '0',
          right: '0',
          height: '15%',
          zIndex: 5,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 30% 100% at 50% 0%, rgba(255,180,60,0.45) 0%, rgba(255,150,0,0.15) 40%, transparent 80%)',
        }}
      />

      {/* Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div ref={cardRef} className="relative">
          {/* Bottom bevel shadow */}
          <div
            className="absolute -bottom-1.5 left-2 right-2 h-4 rounded-2xl"
            style={{ background: 'rgba(255,170,0,0.08)', filter: 'blur(4px)' }}
          />
          <Card
            className="relative border-2 border-white/20 rounded-2xl p-5 sm:p-10 lg:p-14 w-full !flex !flex-col !justify-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(10px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 4px rgba(255,170,0,0.05), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)',
              width: 'min(90vw, 38.5vw)',
              minWidth: '320px',
              maxWidth: '770px',
              minHeight: '0',
            }}
          >
            <CardHeader className="!flex !flex-col !items-center text-center pb-6">
              <CardTitle className="text-3xl sm:text-5xl lg:text-6xl font-medium text-primary-500 tracking-tight">
                FastTrack
              </CardTitle>
              <CardDescription className="text-white text-xl max-sm:text-base whitespace-nowrap">
                Your Intermittent Fasting Coach
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-10">
              {/* Google Sign-In */}
              <Button
                variant="outline"
                className="w-full gap-2 sm:gap-3 border-2 border-white/20 text-white hover:text-primary-50 h-12 sm:h-[5.5rem] text-sm sm:text-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.15)',
                }}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1 bg-white/10" />
                <span className="text-xs text-[#5A5228]">or</span>
                <Separator className="flex-1 bg-white/10" />
              </div>

              {/* Sign In / Sign Up toggle */}
              <div className="flex bg-white/5 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); }}
                  className={`flex-1 py-3 sm:py-5 rounded-md text-base sm:text-lg font-medium transition-colors ${
                    mode === 'signin' ? 'bg-white/10 shadow text-primary-500' : 'text-white/50'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`flex-1 py-3 sm:py-5 rounded-md text-base sm:text-lg font-medium transition-colors ${
                    mode === 'signup' ? 'bg-white/10 shadow text-primary-500' : 'text-white/50'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label className="text-white text-base sm:text-lg">Display Name</Label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="bg-white/5 border-white/10 text-primary-50 placeholder:text-[#5A5228] h-12 sm:h-16 text-base sm:text-lg"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-white text-base sm:text-lg">Email</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/10 text-primary-50 placeholder:text-[#5A5228] h-12 sm:h-16 text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white text-base sm:text-lg">Password</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    className="bg-white/5 border-white/10 text-primary-50 placeholder:text-[#5A5228] h-12 sm:h-16 text-base sm:text-lg"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="!mt-8 sm:!mt-16">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium h-12 sm:h-[5.5rem] text-sm sm:text-xl"
                  >
                    {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
