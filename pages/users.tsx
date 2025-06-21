import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface Profile {
  id: string;
  username: string;
  name: string;
  role: string;
  profile_image_url?: string;
}

const Users = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = router.query; // Get the selected user ID from query parameter

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      if (!id || typeof id !== 'string') {
        setError('No user selected.');
        return;
      }

      if (id === user.id) {
        setError('Cannot view your own profile here.');
        router.push('/profile');
        return;
      }

      // Fetch the selected user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url')
        .eq('id', id)
        .single();

      console.log('Selected profile data:', profileData);
      console.log('Selected profile error:', profileError);

      if (profileError || !profileData) {
        console.error('Error fetching selected profile:', profileError);
        setError('User not found.');
        return;
      }

      setSelectedProfile(profileData);
    };

    fetchData();
  }, [router, id]);

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  if (!user || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
          </svg>
        )}
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">User Profile</h2>
        <div className="flex flex-col items-center space-y-4">
          {selectedProfile.profile_image_url ? (
            <Image
              src={selectedProfile.profile_image_url}
              alt={selectedProfile.name}
              width={100}
              height={100}
              className="rounded-full"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-2xl">{selectedProfile.name.charAt(0)}</span>
            </div>
          )}
          <div className="text-center">
            <h3 className="text-lg font-semibold">{selectedProfile.name}</h3>
            <p
              className="text-gray-600 cursor-pointer hover:text-blue-500 transition duration-300"
              onClick={() => handleProfileClick(selectedProfile.id)}
            >
              @{selectedProfile.username}
            </p>
            <p className="text-gray-500 text-sm">{selectedProfile.role}</p>
          </div>
          <button
            onClick={() => router.push('/foryou')}
            className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Back to For You
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;