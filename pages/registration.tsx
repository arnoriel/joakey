import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

const Registration = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      }
    };
    checkUser();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const file = new File([croppedImageBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let imageUrl = '';
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, profileImage);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username,
          name,
          role,
          profile_image_url: imageUrl
        });

      if (insertError) throw insertError;

      router.push('/foryou');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
      <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white font-gamer"
    >
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-extrabold text-center text-white mb-6 tracking-wider">👾 Complete Your Profile</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Profile Image</label>
            <div className="flex justify-center items-center border-2 border-dashed border-purple-500 rounded-xl p-6 bg-white/5 hover:bg-white/10 transition">
              <div className="text-center space-y-2">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" width={100} height={100} className="mx-auto rounded-full border-4 border-purple-500 shadow-lg" />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                  </svg>
                )}
                <label htmlFor="file-upload" className="inline-block cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
                  Upload
                  <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-200">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 p-2"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 p-2"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-200">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 p-2"
            >
              <option value="">Select a role</option>
              <option value="Buyer">Pembeli</option>
              <option value="Jockey">Penjoki</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold tracking-wide hover:scale-105 transition transform duration-300 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : '🚀 Complete Registration'}
          </button>
        </form>
      </div>

      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center animate-fade-in-fast">
          <div className="bg-[#1f1f2e] p-6 rounded-xl shadow-2xl w-full max-w-md relative border border-purple-700">
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
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
              <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={() => setShowCropModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={handleCropComplete}>Crop</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Registration;
