import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface Profile {
  username: string;
  name: string;
  profile_image_url?: string;
  bio?: string;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
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
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, name, profile_image_url, bio')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      setProfile(profileData);
      setUsername(profileData.username);
      setName(profileData.name);
      setBio(profileData.bio || '');
      setPreviewUrl(profileData.profile_image_url || null);
    };

    fetchData();
  }, [router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('No user logged in');

      let imageUrl = profile?.profile_image_url || '';
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, profileImage, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          name,
          bio,
          profile_image_url: imageUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ username, name, bio, profile_image_url: imageUrl });
      alert('Profile updated successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('No user logged in');

      if (profile?.profile_image_url) {
        const fileName = profile.profile_image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('profile-images').remove([`${user.id}/${fileName}`]);
        }
      }

      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteProfileError) throw new Error(`Failed to delete profile: ${deleteProfileError.message}`);

      alert('Profile deleted. You can sign in again to create a new one.');
      router.push('/auth');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/auth');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while logging out');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Update Your Profile</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" width={100} height={100} className="mx-auto rounded-full" />
                ) : (
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              maxLength={255}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
        <div className="mt-4 space-y-2">
          <button onClick={handleLogout} disabled={loading} className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300 disabled:opacity-50">
            {loading ? 'Processing...' : 'Logout'}
          </button>
          <button onClick={handleDeleteAccount} disabled={loading} className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50">
            {loading ? 'Processing...' : 'Delete Account'}
          </button>
          <button
            onClick={() => router.push('/foryou')}
            className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Back to For You
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-full max-w-md relative">
            <div className="relative w-full h-64 bg-black">
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
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowCropModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleCropComplete}>Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;