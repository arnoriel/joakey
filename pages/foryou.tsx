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
  bio?: string;
}

const ForYou = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [otherProfiles, setOtherProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      // Fetch current user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url, bio')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Failed to fetch your profile.');
        return;
      }
      setProfile(profileData);

      // Fetch other users' profiles
      const { data: otherProfilesData, error: otherProfilesError } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url, bio')
        .neq('id', user.id);

      if (otherProfilesError) {
        console.error('Error fetching other profiles:', otherProfilesError);
        setError('Failed to fetch other users.');
        return;
      }
      setOtherProfiles(otherProfilesData || []);
    };

    fetchData();
  }, [router]);

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleOtherProfileClick = (id: string) => {
    router.push(`/users?id=${id}`);
  };

  if (!user || !profile) {
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6">
          <div className="flex items-center space-x-4">
            {profile.profile_image_url ? (
              <Image
                src={profile.profile_image_url}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xl">{profile.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p
                className="text-gray-600 cursor-pointer hover:text-blue-500 transition duration-300"
                onClick={handleProfileClick}
              >
                @{profile.username}
              </p>
              <p className="text-gray-500">{profile.role}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Other Users</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {otherProfiles.length === 0 && !error ? (
            <p className="text-gray-600">No other users found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherProfiles.map((otherProfile) => (
                <div
                  key={otherProfile.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-300"
                  onClick={() => handleOtherProfileClick(otherProfile.id)}
                >
                  {otherProfile.profile_image_url ? (
                    <Image
                      src={otherProfile.profile_image_url}
                      alt={otherProfile.name}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-lg">{otherProfile.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{otherProfile.name}</h3>
                    <p
                      className="text-gray-600 cursor-pointer hover:text-blue-500 transition duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOtherProfileClick(otherProfile.id);
                      }}
                    >
                      @{otherProfile.username}
                    </p>
                    <p className="text-gray-500 text-sm">{otherProfile.bio || 'No Bio Yet'}</p>
                    <p className="text-gray-500 text-sm">{otherProfile.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold mb-4">For You</h2>
          <p className="text-gray-600">
            Welcome to your personalized feed! Here you will find gaming content tailored to your interests,
            including trending matches, top jockeys. Stay tuned for more updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForYou;