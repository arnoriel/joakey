// pages/foryou.tsx
import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  username: string;
  name: string;
  role: string;
  profile_image_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
}

const ForYou = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [otherProfiles, setOtherProfiles] = useState<Profile[]>([]);
  const [followStatus, setFollowStatus] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setCountdown] = useState(3);

  useEffect(() => {
    const isLoginSuccess = sessionStorage.getItem('loginSuccess') === 'true';
    if (isLoginSuccess) {
      setShowSuccess(true);
      sessionStorage.removeItem('loginSuccess'); // agar tidak muncul lagi saat reload

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowSuccess(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      const { data: profileDataRaw, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url, bio')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError('Failed to fetch your profile.');
        return;
      }

      const { data: allFollows } = await supabase
        .from('follows')
        .select('follower_id, following_id');

      const followersCount = allFollows?.filter(f => f.following_id === user.id).length || 0;
      const followingCount = allFollows?.filter(f => f.follower_id === user.id).length || 0;

      setProfile({
        ...profileDataRaw,
        followers_count: followersCount,
        following_count: followingCount
      });

      const { data: otherProfilesRaw } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url, bio')
        .neq('id', user.id);

      const otherProfiles = otherProfilesRaw?.map((p) => {
        const followers = allFollows?.filter(f => f.following_id === p.id).length || 0;
        const following = allFollows?.filter(f => f.follower_id === p.id).length || 0;
        return { ...p, followers_count: followers, following_count: following };
      }) || [];
      setOtherProfiles(otherProfiles);

      const followMap: { [key: string]: boolean } = {};
      allFollows?.forEach(f => {
        if (f.follower_id === user.id) {
          followMap[f.following_id] = true;
        }
      });
      setFollowStatus(followMap);
    };

    fetchData();
  }, [router]);

  const handleFollowToggle = async (profileId: string, isFollowing: boolean) => {
    if (!user) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId);
        setFollowStatus(prev => ({ ...prev, [profileId]: false }));
        setOtherProfiles(prev => prev.map(p => p.id === profileId ? { ...p, followers_count: p.followers_count - 1 } : p));
        setProfile(prev => prev ? { ...prev, following_count: prev.following_count - 1 } : prev);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
        setFollowStatus(prev => ({ ...prev, [profileId]: true }));
        setOtherProfiles(prev => prev.map(p => p.id === profileId ? { ...p, followers_count: p.followers_count + 1 } : p));
        setProfile(prev => prev ? { ...prev, following_count: prev.following_count + 1 } : prev);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to update follow status.');
      } else {
        setError('Failed to update follow status.');
      }
    }
  };

  const handleProfileClick = () => router.push('/profile');
  const handleOtherProfileClick = (id: string) => router.push(`/users?id=${id}`);

  if (!user || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white font-gamer">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white font-gamer"
    >
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-800 via-indigo-700 to-purple-900 text-white px-6 py-4 rounded-xl shadow-lg border border-purple-500 font-gamer w-80 text-center"
        >
          <p className="text-lg font-bold">✅ Login Success</p>
          <div className="mt-2 h-2 w-full bg-purple-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-full bg-green-400"
            />
          </div>
        </motion.div>
      )}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-tr from-purple-800 to-indigo-700 p-6 rounded-xl shadow-lg border border-purple-500/30">
          <div className="flex items-center gap-4">
            {profile.profile_image_url ? (
              <Image src={profile.profile_image_url} alt="Profile" width={80} height={80} className="rounded-full border-2 border-purple-400" />
            ) : (
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">{profile.name.charAt(0)}</div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-purple-300 cursor-pointer" onClick={handleProfileClick}>@{profile.username}</p>
              <p className="text-purple-200">{profile.role}</p>
              <p className="text-purple-100 text-sm">Followers: {profile.followers_count} | Following: {profile.following_count}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-purple-300">Explore Users</h2>
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {otherProfiles.map(p => (
              <div key={p.id} className="bg-gray-900 hover:bg-gray-800 border border-purple-500/20 transition p-4 rounded-xl flex items-center space-x-4 cursor-pointer"
                onClick={() => handleOtherProfileClick(p.id)}>
                {p.profile_image_url ? (
                  <Image src={p.profile_image_url} alt={p.name} width={50} height={50} className="rounded-full border border-purple-400" />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">{p.name.charAt(0)}</div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="text-purple-400">@{p.username}</p>
                    </div>
                    <button
                      className={`px-4 py-1 rounded-full text-sm font-medium transition ${followStatus[p.id] ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(p.id, !!followStatus[p.id]);
                      }}>
                      {followStatus[p.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <p className="text-sm text-purple-200">{p.bio || 'No Bio Yet'}</p>
                  <p className="text-sm text-purple-300">{p.role}</p>
                  <p className="text-sm text-purple-400">Followers: {p.followers_count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-purple-600">
          <h2 className="text-lg font-bold text-purple-300 mb-2">For You</h2>
          <p className="text-purple-200">Welcome to your personalized feed! 🎮 Stay tuned for more updates!</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ForYou;