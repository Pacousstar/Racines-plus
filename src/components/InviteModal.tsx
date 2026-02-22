"use client";

import React, { useState } from 'react';
import { Share2, X, Mail, Copy, CheckCircle, Send, Link2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviterName?: string;
    villageNom?: string;
}

export default function InviteModal({
    isOpen,
    onClose,
    inviterName = '',
    villageNom = 'Toa-Zéo'
}: InviteModalProps) {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [emailSentForReal, setEmailSentForReal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/onboarding?ref=${encodeURIComponent(villageNom)}&inv=${encodeURIComponent(inviterName)}`
        : '';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            setError('Impossible de copier. Copiez manuellement le lien.');
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError('Veuillez entrer un email valide.');
            return;
        }
        setIsSending(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Enregistrer dans invitations (ignore si table inexistante)
                try {
                    await supabase.from('invitations').insert({
                        inviter_id: user.id,
                        email_invite: email.trim().toLowerCase(),
                    });
                } catch {
                    // ignore — table peut ne pas exister encore
                }
            }

            // Envoyer le vrai email via API Resend
            const resp = await fetch('/api/send-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailTo: email.trim(),
                    inviterName: inviterName || 'Un membre de votre famille',
                    villageNom,
                    inviteLink,
                }),
            });

            const result = await resp.json();
            setEmailSentForReal(result.success === true);
            setSent(true);
            setEmail('');
        } catch {
            setError("Erreur réseau. Partagez le lien manuellement.");
            setEmailSentForReal(false);
            setSent(true);
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setEmailSentForReal(false);
        setEmail('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-racines-green to-[#0f3d28] p-6 text-white relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Inviter ma famille</h2>
                            <p className="text-white/80 text-sm">Village de {villageNom}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {!sent ? (
                        <>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Agrandissez votre arbre en invitant les membres de votre famille à rejoindre Racines+.
                                Ils seront directement rattachés au village <strong>{villageNom}</strong>.
                            </p>

                            {/* Lien d'invitation */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Link2 className="w-3.5 h-3.5" /> Lien d&apos;invitation
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate font-mono">
                                        {inviteLink.replace('https://', '')}
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        title="Copier le lien"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                {copied && <p className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Lien copié !</p>}
                            </div>

                            <div className="relative flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">ou envoyer par email</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Envoi par email */}
                            <form onSubmit={handleSendInvite} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="email@famille.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-racines-green focus:ring-2 focus:ring-racines-green/10 outline-none text-sm"
                                    />
                                </div>
                                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isSending || !email}
                                    className="w-full bg-racines-green disabled:bg-gray-200 disabled:text-gray-400 hover:bg-racines-light text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSending
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <><Send className="w-4 h-4" /> Envoyer l&apos;invitation</>
                                    }
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className={`w-16 h-16 ${emailSentForReal ? 'bg-green-50' : 'bg-orange-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                {emailSentForReal
                                    ? <CheckCircle className="w-8 h-8 text-green-500" />
                                    : <Share2 className="w-8 h-8 text-orange-500" />
                                }
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">
                                {emailSentForReal ? '✅ Invitation envoyée !' : 'Partagez le lien'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                {emailSentForReal
                                    ? 'Votre invitation a bien été envoyée par email. Votre famille recevra un lien pour rejoindre Racines+.'
                                    : 'Copiez et partagez le lien ci-dessous en attendant la configuration du système email.'
                                }
                            </p>
                            {!emailSentForReal && (
                                <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-600 mb-4 text-left break-all">
                                    {inviteLink}
                                </div>
                            )}
                            <button onClick={handleClose} className="bg-racines-green text-white px-6 py-3 rounded-xl font-bold text-sm">
                                Fermer
                            </button>
                        </div>
                    )}

                    {/* Partage WhatsApp */}
                    {!sent && (
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Rejoins-moi sur Racines+ pour construire notre arbre généalogique : ${inviteLink}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full border border-green-200 bg-green-50 text-green-700 py-3 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                        >
                            <span className="text-lg">📲</span> Partager sur WhatsApp
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
