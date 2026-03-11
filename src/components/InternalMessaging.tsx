"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { MessageSquare, Send, X, Users, Shield, Star, ShieldCheck } from 'lucide-react';

interface InternalMessage {
    id: string;
    sender_id: string;
    receiver_role: string;
    content: string;
    created_at: string;
    sender?: { first_name: string; last_name: string; role: string };
}

interface InternalMessagingProps {
    currentUserRole: string;
    currentUserId: string;
}

export default function InternalMessaging({ currentUserRole, currentUserId }: InternalMessagingProps) {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<InternalMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('admin');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Can send to and read from these roles
    const getAvailableRoles = () => {
        if (currentUserRole === 'admin') return ['cho', 'choa', 'ambassadeur', 'admin'];
        if (currentUserRole === 'cho') return ['admin', 'choa', 'cho'];
        if (currentUserRole === 'choa') return ['admin', 'cho'];
        if (currentUserRole === 'ambassadeur') return ['admin'];
        return [];
    };

    const rolesIcons: Record<string, { icon: any, label: string, color: string }> = {
        admin: { icon: Shield, label: 'Administration', color: 'text-purple-600' },
        cho: { icon: ShieldCheck, label: 'Chefs (CHO)', color: 'text-blue-600' },
        choa: { icon: Users, label: 'Adjoints (CHOa)', color: 'text-cyan-600' },
        ambassadeur: { icon: Star, label: 'Ambassadeurs', color: 'text-amber-500' }
    };

    const availableRoles = getAvailableRoles();

    useEffect(() => {
        if (!isOpen) return;

        const loadMessages = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('internal_messages')
                .select('*, sender:sender_id(first_name, last_name, role, avatar_url)')
                .in('receiver_role', [selectedRole, currentUserRole])
                .order('created_at', { ascending: true })
                // Limit to recent to avoid heavy loads initially
                // .limit(50) 
                ;

            if (data) {
                // Filter messages relevant to the selected conversation
                const filtered = data.filter(m =>
                    (m.receiver_role === selectedRole && m.sender_id === currentUserId) ||
                    (m.receiver_role === selectedRole && m.sender?.role === currentUserRole) ||
                    (m.receiver_role === currentUserRole && m.sender?.role === selectedRole) ||
                    (m.receiver_role === selectedRole && selectedRole === currentUserRole)
                );

                // Fetch profiles for sender_id since foreign key relation might be named differently or fail
                const enhancedMessages = await Promise.all(filtered.map(async (m) => {
                    if (!m.sender) {
                        const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role, avatar_url').eq('id', m.sender_id).single();
                        return { ...m, sender: profile };
                    }
                    return m;
                }));

                setMessages(enhancedMessages as any);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
            setIsLoading(false);
        };

        loadMessages();

        const channel = supabase.channel('internal_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, () => {
                loadMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, selectedRole, currentUserRole, currentUserId, supabase]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const { error } = await supabase.from('internal_messages').insert({
            sender_id: currentUserId,
            receiver_role: selectedRole,
            content: newMessage.trim()
        });

        if (error) {
            alert("Erreur d'envoi du message : " + error.message);
        } else {
            setNewMessage('');
        }
    };

    if (!availableRoles.length) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 border-2 border-white text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-black transition-all z-40 group"
            >
                <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF6600] border-2 border-white"></span>
                </span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
                            <h2 className="font-black text-lg flex items-center gap-2 tracking-tight">
                                <MessageSquare className="w-5 h-5 text-[#FF6600]" />
                                Messagerie Interne
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>

                        {/* Canaux */}
                        <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 p-2 gap-2 scrollbar-none">
                            {availableRoles.map(role => {
                                const roleInfo = rolesIcons[role];
                                if (!roleInfo) return null;
                                return (
                                    <button
                                        key={role}
                                        onClick={() => setSelectedRole(role)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedRole === role ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <roleInfo.icon className={`w-3.5 h-3.5 ${roleInfo.color}`} />
                                        {roleInfo.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                            {isLoading && messages.length === 0 ? (
                                <p className="text-center text-xs text-gray-500 py-10">Chargement des messages...</p>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-10 opacity-60">
                                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold">Aucun message</p>
                                    <p className="text-[10px] text-gray-400">Lancez la discussion !</p>
                                </div>
                            ) : (
                                messages.map((m, i) => {
                                    const isMe = m.sender_id === currentUserId;
                                    return (
                                        <div key={m.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[90%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                                            {!isMe && (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white shadow-sm">
                                                    {m.sender?.avatar_url ? (
                                                        <img src={m.sender.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-[10px] font-bold text-white">
                                                            {m.sender?.first_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && (
                                                    <span className="text-[9px] font-bold text-gray-400 mb-1 ml-1 uppercase">
                                                        {m.sender?.first_name} {m.sender?.last_name} ({m.sender?.role})
                                                    </span>
                                                )}
                                                <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-[#FF6600] text-white rounded-br-sm shadow-md shadow-orange-100' : 'bg-white border border-gray-100 rounded-bl-sm shadow-sm'}`}>
                                                    {m.content}
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">
                                                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={`Message pour ${rolesIcons[selectedRole]?.label || selectedRole}...`}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 outline-none text-sm transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-[#FF6600] disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
