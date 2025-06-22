// pages/users.tsx
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

const Users = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = router.query;
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleOpenImageModal = (url: string) => {
    setModalImageUrl(url);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/auth');
      setUser(user);

      if (!id || typeof id !== 'string') return setError('No user selected.');
      if (id === user.id) return router.push('/profile');

      const { data: profileRaw, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, name, role, profile_image_url, bio')
        .eq('id', id)
        .single();

      if (profileError || !profileRaw) return setError('User not found.');

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id);

      setSelectedProfile({
        ...profileRaw,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      });

      const { data: followData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single();

      setIsFollowing(!!followData);
    };

    fetchData();
  }, [router, id]);

  const handleFollowToggle = async () => {
    if (!user || !selectedProfile) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', selectedProfile.id);
        if (error) throw error;
        setIsFollowing(false);
        setSelectedProfile((prev) => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: selectedProfile.id });
        if (error) throw error;
        setIsFollowing(true);
        setSelectedProfile((prev) => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update follow status.');
    }
  };

  if (!user || error) {
    return <div className="min-h-screen flex justify-center items-center bg-black text-white font-gamer">{error || 'Loading...'}</div>;
  }

  if (!selectedProfile) {
    return <div className="min-h-screen flex justify-center items-center bg-black text-white font-gamer">Loading profile...</div>;
  }

  return (
     <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white font-gamer"
    >
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-xl shadow-xl border border-purple-600">
        <h1 className="text-2xl font-bold text-center mb-4">User Profile 🎮</h1>
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            {selectedProfile.profile_image_url ? (
              <Image
                src={selectedProfile.profile_image_url}
                alt={selectedProfile.name}
                width={100}
                height={100}
                className="rounded-full border border-purple-500 cursor-pointer hover:opacity-80"
                onClick={() => handleOpenImageModal(selectedProfile.profile_image_url!)}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                {selectedProfile.name.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold">{selectedProfile.name}</h2>
          <p className="text-purple-300">@{selectedProfile.username}</p>
          <p className="text-gray-400 text-sm mb-1">{selectedProfile.role}</p>
          <p className="text-gray-400 text-sm mb-2">{selectedProfile.bio || 'No bio yet'}</p>
          <p className="text-purple-300 mb-4">Followers: {selectedProfile.followers_count} | Following: {selectedProfile.following_count}</p>

          <button
            className={`px-4 py-2 rounded-lg font-semibold w-full transition duration-300 ${
              isFollowing ? 'bg-gray-600 hover:bg-gray-500' : 'bg-purple-600 hover:bg-purple-500'
            }`}
            onClick={handleFollowToggle}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={() => router.push('/foryou')}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded transition"
          >
            Back to For You
          </button>
        </div>
      </div>

      {showImageModal && modalImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={handleCloseImageModal}
        >
          <div className="bg-gray-800 p-4 rounded-xl border border-purple-600" onClick={e => e.stopPropagation()}>
            <Image src={modalImageUrl} alt="Profile Full" width={300} height={300} className="rounded-lg" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Users;