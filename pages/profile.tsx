// pages/profile.tsx
import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { motion } from 'framer-motion';

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface JockeyService {
  game: string;
  from_rank: string;
  to_rank: string;
  price: number;
}

interface Profile {
  username: string;
  name: string;
  profile_image_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  role?: string;
  jockey_services?: JockeyService[];
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [jockeyServices, setJockeyServices] = useState<JockeyService[]>([
    { game: '', from_rank: '', to_rank: '', price: 0 },
  ]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/auth');
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, name, profile_image_url, bio, role, jockey_services')
        .eq('id', user.id)
        .single();

      if (!profileData) return;

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setProfile({ ...profileData, followers_count: followersCount || 0, following_count: followingCount || 0 });
      setUsername(profileData.username);
      setName(profileData.name);
      setBio(profileData.bio || '');
      setPreviewUrl(profileData.profile_image_url || null);
      setRole(profileData.role || 'buyer');
      setJockeyServices(profileData.jockey_services || [{ game: '', from_rank: '', to_rank: '', price: 0 }]);
    };
    fetchData();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropModal(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('Not logged in');
      let imageUrl = profile?.profile_image_url || '';

      if (profileImage) {
        const ext = profileImage.name.split('.').pop();
        if (!ext) throw new Error('Invalid image file');
        const filename = `${user.id}/${Math.random().toString(36).slice(2)}.${ext}`;
        await supabase.storage.from('profile-images').upload(filename, profileImage, { upsert: true });
        const { data } = supabase.storage.from('profile-images').getPublicUrl(filename);
        imageUrl = data.publicUrl;
      }

      await supabase
        .from('profiles')
        .update({
          username,
          name,
          bio,
          profile_image_url: imageUrl,
          role: role.toLowerCase(), // pastikan disimpan dalam lowercase
          jockey_services: role.toLowerCase() === 'jockey' ? jockeyServices : null,
        })
        .eq('id', user.id);

      setProfile({
        username,
        name,
        bio,
        profile_image_url: imageUrl,
        followers_count: profile?.followers_count || 0,
        following_count: profile?.following_count || 0,
        role,
        jockey_services: role === 'jockey' ? jockeyServices : undefined,
      });

      alert('Profile updated!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your profile permanently?')) return;
    setLoading(true);
    try {
      if (!user) throw new Error('No user');
      const url = profile?.profile_image_url;
      const filename = url ? url.split('/').pop() : null;
      if (filename) await supabase.storage.from('profile-images').remove([`${user.id}/${filename}`]);
      await supabase.from('profiles').delete().eq('id', user.id);
      router.push('/auth');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  if (!user || !profile) {
    return <div className="min-h-screen flex justify-center items-center bg-black text-white font-gamer">Loading...</div>;
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
        <h1 className="text-2xl font-bold text-center mb-4">Update Profile 🎮</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="text-center mb-4">
          <p className="text-purple-300">Followers: {profile.followers_count} | Following: {profile.following_count}</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm">Profile Image</label>
            <div className="flex justify-center mt-2">
              {previewUrl ? (
                <Image src={previewUrl} alt="Preview" width={100} height={100} className="rounded-full border border-purple-500" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700"></div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 text-sm" />
          </div>

          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full bg-gray-800 border border-purple-500 rounded px-3 py-2" />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="w-full bg-gray-800 border border-purple-500 rounded px-3 py-2" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" className="w-full bg-gray-800 border border-purple-500 rounded px-3 py-2"></textarea>

          {role === 'Jockey' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-purple-300">Jasa Joki 🎮</h2>

              {jockeyServices.map((service, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded border border-purple-500 space-y-2">
                  <input type="text" placeholder="Game" value={service.game} onChange={e => {
                    const updated = [...jockeyServices];
                    updated[idx].game = e.target.value;
                    setJockeyServices(updated);
                  }} className="w-full bg-gray-700 px-2 py-1 rounded" />
                  <div className="flex gap-2">
                    <input type="text" placeholder="From Rank" value={service.from_rank} onChange={e => {
                      const updated = [...jockeyServices];
                      updated[idx].from_rank = e.target.value;
                      setJockeyServices(updated);
                    }} className="w-full bg-gray-700 px-2 py-1 rounded" />
                    <input type="text" placeholder="To Rank" value={service.to_rank} onChange={e => {
                      const updated = [...jockeyServices];
                      updated[idx].to_rank = e.target.value;
                      setJockeyServices(updated);
                    }} className="w-full bg-gray-700 px-2 py-1 rounded" />
                  </div>
                  <input type="number" placeholder="Harga (Rp)" value={service.price} onChange={e => {
                    const updated = [...jockeyServices];
                    updated[idx].price = parseInt(e.target.value);
                    setJockeyServices(updated);
                  }} className="w-full bg-gray-700 px-2 py-1 rounded" />
                  <button type="button" onClick={() => {
                    const updated = jockeyServices.filter((_, i) => i !== idx);
                    setJockeyServices(updated);
                  }} className="text-red-400 hover:underline">Hapus</button>
                </div>
              ))}

              <button type="button" onClick={() => setJockeyServices([...jockeyServices, { game: '', from_rank: '', to_rank: '', price: 0 }])} className="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-sm">+ Tambah Rank Joki</button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded transition">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button onClick={handleDeleteAccount} disabled={loading} className="w-full bg-red-600 hover:bg-red-500 py-2 rounded">Delete Account</button>
          <button onClick={() => router.push('/foryou')} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded">Back to For You Page</button>
          <button onClick={handleLogout} disabled={loading} className="w-full bg-gray-600 hover:bg-gray-500 py-2 rounded">Logout</button>
        </div>
      </div>

      {showCropModal && imageSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded-lg w-full max-w-md border border-purple-600">
            <div className="relative w-full h-64">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, area) => setCroppedAreaPixels(area)}
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="bg-gray-600 px-4 py-2 rounded" onClick={() => setShowCropModal(false)}>Cancel</button>
              <button className="bg-purple-600 px-4 py-2 rounded text-white" onClick={handleCropComplete}>Crop</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;
