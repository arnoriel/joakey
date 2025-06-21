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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(`${baseUrl}/`);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:scale-105">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800">Joakey</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to swim up and upgrade your gaming Ranks</p>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
            </svg>
          ) : (
            <Image src="/google-icon.png" alt="Google" width={50} height={50} className="mr-3" />
          )}
          <span className="font-semibold">{loading ? 'Loading...' : 'Continue with Google'}</span>
        </button>
      </div>
    </div>
  );
};

export default Auth;