import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) {
      console.error('Error logging in with Google:', error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://joakey-apps.vercel.app';
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(`${baseUrl}/`);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  
useEffect(() => {
  const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const particles: { x: number; y: number; r: number; d: number }[] = [];
  const maxParticles = 100;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      d: Math.random() * maxParticles
    });
  }

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    update();
  };

  let angle = 0;
  const update = () => {
    angle += 0.01;
    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];
      p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
      p.x += Math.sin(angle) * 2;

      if (p.x > canvas.width + 5 || p.x < -5 || p.y > canvas.height) {
        particles[i] = {
          x: Math.random() * canvas.width,
          y: -10,
          r: p.r,
          d: p.d
        };
      }
    }
  };

  const loop = () => {
    draw();
    requestAnimationFrame(loop);
  };
  loop();
}, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Gaming Background Animation */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-[#1f0036] via-[#0f0c29] to-[#24243e] opacity-90 animate-background-glow"></div>
        <canvas id="particle-canvas" className="absolute inset-0 w-full h-full"></canvas>
      </div>

      {/* Auth Card */}
      <div className="z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl relative animate-fade-in">
        <h1 className="text-4xl font-extrabold text-center text-purple-400 tracking-wide mb-4">🎮 Joakey</h1>
        <p className="text-center text-gray-300 mb-6">Sign in to swim up and upgrade your gaming Ranks</p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
            </svg>
          ) : (
            <Image src="/google-icon.png" alt="Google" width={32} height={32} />
          )}
          <span className="font-semibold">{loading ? 'Loading...' : 'Continue with Google'}</span>
        </button>
      </div>
        {/* Watermark */}
      <div className="absolute bottom-4 text-center w-full z-10">
        <p className="text-sm text-gray-500">© 2025, Azriel. Beta Version</p>
      </div>
    </div>
  );
};

export default Auth;