import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase'; // Import User type
import { useRouter } from 'next/router';

export default function Home() {
  const [user, setUser] = useState<User | null>(null); // Use User type instead of any
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center transform transition-all hover:scale-105">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-800">Joakey</h1>
        {user ? (
          <>
            <p className="mb-6 text-gray-600">Welcome back, <span className="font-semibold">{user.email}</span></p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-6 rounded-lg hover:bg-red-600 transition duration-300 shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-300 shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}