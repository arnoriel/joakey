import { useRouter } from 'next/router';
import { useState } from 'react';

const Summary = () => {
  const router = useRouter();
  const vaNumber = '3901085797009915'; // VA statis
  const [copied, setCopied] = useState(false);

  const {
    jockeyId,
    jockeyName,
    game,
    from,
    to,
    price,
  } = router.query;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin VA:', err);
    }
  };

  if (!jockeyId || !jockeyName || !game || !from || !to || !price) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center font-gamer">
        Loading summary...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-6 text-white font-gamer flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-xl border border-purple-600 w-full max-w-md">
        <h1 className="text-2xl font-bold text-purple-300 mb-4 text-center">🧾 Ringkasan Pesanan</h1>

        <div className="space-y-2">
          <p><span className="font-semibold">Penjoki:</span> {jockeyName}</p>
          <p><span className="font-semibold">Game:</span> {game}</p>
          <p><span className="font-semibold">Dari Rank:</span> {from}</p>
          <p><span className="font-semibold">Ke Rank:</span> {to}</p>
          <p><span className="font-semibold text-green-400">Total Pembayaran:</span> <span className="text-green-300">Rp{Number(price).toLocaleString()}</span></p>

          <div className="mt-4 p-4 bg-black rounded-lg border border-dashed border-green-500 text-center">
            <p className="mb-1 text-sm text-gray-400">Transfer ke Virtual Account:</p>
            <p className="text-xl font-bold tracking-widest text-green-400">{vaNumber}</p>
            <p className="mb-1 text-sm text-gray-400">A/N: Admin Joakey</p>
            <button
              onClick={handleCopy}
              className="mt-2 bg-green-700 hover:bg-green-600 px-4 py-1 rounded text-sm font-semibold"
            >
              {copied ? '✔️ Disalin!' : 'Salin VA'}
            </button>
            <p className="text-xs text-gray-400 mt-1">Transfer sebelum 30 menit</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          Catatan: Pembayaran ini akan diteruskan kepada Penjoki, jika belum ada Pembayaran maka Proses Joki akunmu tidak akan dimulai.
        </p>

         <p className="text-xs text-gray-400 mt-1">
          Chat penjoki jika sudah melakukan transaksi pembayaran.
        </p>

        <button
          onClick={() =>
            router.push({
              pathname: '/users',
              query: { id: jockeyId },
            })
          }
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded transition"
        >
          Kembali ke Profil {jockeyName}
        </button>
      </div>
    </div>
  );
};

export default Summary;
