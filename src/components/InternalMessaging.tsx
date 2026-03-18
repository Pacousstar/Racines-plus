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
    sender?: { first_name: string; last_name: string; role: string; avatar_url?: string | null };
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
                .select('*')
                .in('receiver_role', [selectedRole, currentUserRole])
                .order('created_at', { ascending: true })
                .limit(150);

            if (data) {
                // Filtre local pour n'afficher que le "canal" actif.
                const filtered = data.filter(m =>
                    (m.receiver_role === selectedRole && m.sender_id === currentUserId) ||
                    (m.receiver_role === currentUserRole && m.sender_id !== currentUserId) ||
                    (m.receiver_role === selectedRole && selectedRole === currentUserRole)
                );

                // Récupération globale des IDs d'expéditeurs pour éviter les requêtes N+1
                const senderIds = [...new Set(filtered.map(m => m.sender_id))];
                let profilesMap: Record<string, { first_name: string; last_name: string; role: string; avatar_url: string | null }> = {};

                if (senderIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, role, avatar_url')
                        .in('id', senderIds);
                    
                    if (profiles) {
                        profiles.forEach(p => {
                            profilesMap[p.id] = p;
                        });
                    }
                }

                // Hydratation des messages
                const enhancedMessages = filtered.map(m => ({
                    ...m,
                    sender: profilesMap[m.sender_id] || { first_name: 'Utilisateur', last_name: 'Inconnu', role: 'Inconnu', avatar_url: null }
                }));

                setMessages(enhancedMessages as any);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
            }
            setIsLoading(false);
        };

        loadMessages();

        const channel = supabase.channel(`internal_messages_${selectedRole}`)
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
        if (!newMessage.trim() || isLoading) return;

        // Pré-injection du message optimiste pour l'URL fluide
        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            sender_id: currentUserId,
            receiver_role: selectedRole,
            content: newMessage.trim(),
            created_at: new Date().toISOString(),
            sender: { first_name: 'Moi', last_name: '', role: currentUserRole } // Fallback
        };
        
        setMessages(prev => [...prev, optimisticMsg as any]);
        setNewMessage('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        const { error } = await supabase.from('internal_messages').insert({
            sender_id: currentUserId,
            receiver_role: selectedRole,
            content: optimisticMsg.content
        });

        if (error) {
            console.error("Erreur d'envoi du message : ", error.message);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id)); // Rollback
        }
    };

    if (!availableRoles.length) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-[2rem] shadow-2xl shadow-orange-500/20 flex items-center justify-center transition-all z-40 group border-4 border-white ${isOpen ? 'bg-[#FF6600] text-white scale-110' : 'bg-gray-900 text-white hover:scale-110 hover:bg-[#FF6600]'}`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF6600] border-2 border-white"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex justify-end md:p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full md:w-[450px] md:rounded-[2.5rem] h-full shadow-2xl animate-in slide-in-from-right-8 duration-500 border border-white/20 flex flex-col overflow-hidden">
                        {/* Header Premium */}
                        <div className="p-6 border-b border-gray-100 flex flex-col bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-2xl text-gray-900 flex items-center gap-3 tracking-tight">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-[#FF6600]" />
                                    </div>
                                    Chats
                                </h2>
                                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-95 group">
                                    <X className="w-6 h-6 text-gray-300 group-hover:text-gray-900" />
                                </button>
                            </div>
                            
                            {/* Tabs des Canaux */}
                            <div className="flex overflow-x-auto gap-2 scrollbar-none pb-1">
                                {availableRoles.map(role => {
                                    const roleInfo = rolesIcons[role];
                                    if (!roleInfo) return null;
                                    const isSelected = selectedRole === role;
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${isSelected ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                        >
                                            <roleInfo.icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-[#FF6600]' : roleInfo.color}`} />
                                            {roleInfo.label.split(' ')[0]} {/* Raccourcir le label si nécessaire */}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Zone de Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50/50 to-white">
                            {isLoading && messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#FF6600] animate-spin" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Synchronisation...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-20 opacity-60 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-black text-gray-900">Le canal est vide</p>
                                    <p className="text-xs text-gray-400 font-medium">Envoyez un message pour démarrer avec les {rolesIcons[selectedRole]?.label}.</p>
                                </div>
                            ) : (
                                messages.map((m, i) => {
                                    const isMe = m.sender_id === currentUserId;
                                    const showHeader = i === 0 || messages[i - 1].sender_id !== m.sender_id || (new Date(m.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000);
                                    
                                    return (
                                        <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'} animate-in slide-in-from-bottom-2`}>
                                            {!isMe && showHeader && (
                                                <div className="w-8 h-8 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 uppercase">
                                                    {m.sender?.avatar_url ? (
                                                        <img src={m.sender.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        m.sender?.first_name?.[0] || '?'
                                                    )}
                                                </div>
                                            )}
                                            {!isMe && !showHeader && <div className="w-8 flex-shrink-0" />} {/* Espaceur */}
                                            
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && showHeader && (
                                                    <span className="text-[9px] font-black text-gray-400 mb-1 ml-1 uppercase tracking-widest">
                                                        {m.sender?.first_name} {m.sender?.last_name} ({m.sender?.role})
                                                    </span>
                                                )}
                                                <div className={`px-5 py-3 ${isMe ? 'bg-[#FF6600] text-white rounded-[1.5rem] rounded-br-sm shadow-xl shadow-orange-500/20' : 'bg-white border border-gray-100/80 rounded-[1.5rem] rounded-bl-sm shadow-sm'}`}>
                                                    <p className={`text-[15px] leading-relaxed font-medium ${isMe ? 'text-white' : 'text-gray-800'}`}>
                                                        {m.content}
                                                    </p>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase text-gray-300 mt-1.5 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                            <div className="relative flex items-center bg-gray-50 rounded-[2rem] border border-gray-100 p-1.5 focus-within:ring-4 focus-within:ring-orange-50 focus-within:border-[#FF6600] transition-all group">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={`Message ${rolesIcons[selectedRole]?.label || selectedRole}...`}
                                    className="flex-1 bg-transparent px-5 py-3 outline-none text-[15px] font-medium placeholder-gray-400 text-gray-900"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-12 h-12 rounded-[1.5rem] bg-gray-900 text-white hover:bg-[#FF6600] flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-gray-900 active:scale-90 flex-shrink-0 shadow-sm"
                                >
                                    <Send className="w-5 h-5 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
