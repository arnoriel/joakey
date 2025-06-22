// [IMPORT & STATE - TAMBAHAN]
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import Image from 'next/image';

type Message = {
    id: string;
    chat_id: string;
    sender_id: string;
    text: string;
    type: 'text' | 'image' | 'video'; // sesuaikan jika ada tipe lain
    created_at?: string;
};

type Profile = {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
};

const ChatWith = () => {
    const router = useRouter();
    const { toId } = router.query;

    const [userId, setUserId] = useState('');
    const [chatId, setChatId] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [editMessageId, setEditMessageId] = useState<string | null>(null);
    const [toProfile, setToProfile] = useState<Profile | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // INIT & FETCH PROFILE + CHAT
    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || typeof toId !== 'string') return;

            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, name, username, profile_image_url')
                .eq('id', toId)
                .single();
            setToProfile(profile);

            const { data: existingChat } = await supabase
                .from('chats')
                .select('id')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${toId}),and(user1_id.eq.${toId},user2_id.eq.${user.id})`)
                .maybeSingle();

            if (existingChat?.id) {
                setChatId(existingChat.id);
            } else {
                const { data: newChat } = await supabase
                    .from('chats')
                    .insert({ user1_id: user.id, user2_id: toId })
                    .select()
                    .single();
                if (newChat?.id) setChatId(newChat.id);
            }
        };

        initChat();
    }, [toId]);

    // FETCH MESSAGE + REALTIME
    useEffect(() => {
        if (!chatId) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        };

        // Panggil fungsi async dengan cara yang aman
        void fetchMessages(); // pakai `void` agar tidak return Promise ke useEffect

        const channel = supabase
            .channel(`chat-${chatId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`,
            }, () => {
                void fetchMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        if (!chatId || !userId) return;

        const encrypted = encryptMessage(newMessage);

        if (editMessageId) {
            await supabase.from('messages').update({
                text: encrypted,
            }).eq('id', editMessageId);
            setEditMessageId(null);
        } else {
            await supabase.from('messages').insert({
                chat_id: chatId,
                sender_id: userId,
                text: encrypted,
                type: 'text',
            });
        }

        setNewMessage('');
    };

    const handleDelete = async () => {
        if (messageToDelete) {
            await supabase.from('messages').delete().eq('id', messageToDelete.id);
            setShowDeleteModal(false);
            setMessageToDelete(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-gamer">
            {/* Navbar */}
            <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
                <button onClick={() => router.push(`/users?id=${toId}`)} className="text-white text-sm px-2 py-1 rounded hover:bg-gray-700">
                    ← Back
                </button>
                <div className="text-center flex-1 text-purple-300 font-semibold text-sm">
                    Chat With @{toProfile?.username || '...'}
                </div>
                <div className="w-[50px]" />
            </div>

            {/* Profile Info */}
            {toProfile && (
                <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-700 bg-gray-800">
                    {toProfile.profile_image_url ? (
                        <Image src={toProfile.profile_image_url} alt={toProfile.name} width={48} height={48} className="rounded-full" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg">
                            {toProfile.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <div className="font-bold">{toProfile.name}</div>
                        <div className="text-sm text-gray-400">@{toProfile.username}</div>
                    </div>
                </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
                Tolong gunakan bahasa yang sopan dan baik Antar pengguna, dan hormati hak Pembeli / Penjoki
            </p>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    const decryptedText = decryptMessage(msg.text);

                    return (
                        <div key={msg.id} className={`group relative max-w-xs px-3 py-2 rounded-lg ${isMine ? 'bg-purple-600 self-end ml-auto' : 'bg-gray-700 self-start mr-auto'
                            }`}>
                            {msg.type === 'text' && <p>{decryptedText}</p>}

                            {/* Hover Actions */}
                            {isMine && (
                                <div className="absolute -top-6 right-0 hidden group-hover:flex gap-2 text-xs text-white">
                                    <button
                                        onClick={() => {
                                            setEditMessageId(msg.id);
                                            setNewMessage(decryptedText);
                                        }}
                                        className="bg-gray-600 px-2 py-1 rounded hover:bg-gray-500"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMessageToDelete(msg);
                                            setShowDeleteModal(true);
                                        }}
                                        className="bg-red-600 px-2 py-1 rounded hover:bg-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef}></div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2">
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 p-2 rounded bg-gray-800 text-white"
                    placeholder={editMessageId ? 'Edit message...' : 'Type a message...'}
                />
                <button onClick={sendMessage} className="bg-purple-700 px-4 py-2 rounded">
                    {editMessageId ? 'Update' : 'Send'}
                </button>
            </div>

            {/* Modal Delete */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-xl border border-red-500 text-center max-w-sm w-full">
                        <p className="mb-4">Yakin ingin menghapus pesan ini?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
                            >
                                Ya, hapus
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWith;
