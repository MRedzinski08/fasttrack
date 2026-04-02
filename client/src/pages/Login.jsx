import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { api } from '../services/api.js';
import { motion } from 'framer-motion';

const googleProvider = new GoogleAuthProvider();

const ease = [0.16, 1, 0.3, 1];

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        // Set display name on the Firebase user object so onboarding can read it
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-4xl font-display tracking-[0.3em] font-bold">
            <span className="text-white">FAST</span>
            <span className="text-primary-500">TRACK</span>
          </h1>
          <p className="text-sm text-white/60 tracking-wider mt-2">Your Intermittent Fasting Coach</p>
        </motion.div>

        {/* Google Sign-In */}
        <motion.button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-white/[0.08] text-white py-3 text-sm uppercase tracking-[0.15em] transition-all duration-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-4 my-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex-1 h-[1px] bg-white/[0.08]" />
          <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
          <div className="flex-1 h-[1px] bg-white/[0.08]" />
        </motion.div>

        {/* Sign In / Sign Up toggle */}
        <motion.div
          className="flex gap-8 mb-8 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`text-sm uppercase tracking-[0.15em] pb-1 transition-all duration-300 ${
              mode === 'signin'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`text-sm uppercase tracking-[0.15em] pb-1 transition-all duration-300 ${
              mode === 'signup'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Sign Up
          </button>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease }}
        >
          {mode === 'signup' && (
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
              />
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-white/60 block mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              className="w-full bg-transparent border-b border-white/[0.1] text-white py-3 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {error && (
            <motion.p
              className="text-red-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-black py-3 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary-400 disabled:opacity-40 mt-4 font-medium"
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </motion.form>
      </motion.div>
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
