"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function AuthConfirmPage() {
    const router = useRouter();
    const supabase = createClient();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Vérification de votre email en cours...');

    useEffect(() => {
        const handleEmailConfirmation = async () => {
            // Supabase gère automatiquement l'échange du token depuis l'URL
            // Il suffit d'attendre que la session soit établie
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                setStatus('error');
                setMessage('Le lien de confirmation est invalide ou a expiré.');
                return;
            }

            if (session) {
                setStatus('success');
                setMessage('Votre email a été confirmé avec succès ! Bienvenue dans Racines+ 🌳');
                // Redirection automatique après 3 secondes
                setTimeout(() => router.push('/dashboard'), 3000);
            } else {
                // Attendre un peu et réessayer (le token peut prendre un instant)
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) {
                        setStatus('success');
                        setMessage('Email confirmé ! Redirection vers votre tableau de bord...');
                        setTimeout(() => router.push('/dashboard'), 2000);
                    } else {
                        setStatus('error');
                        setMessage('Impossible de confirmer votre email. Le lien a peut-être expiré.');
                    }
                }, 1500);
            }
        };

        handleEmailConfirmation();
    }, [router, supabase]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-10 w-full max-w-md text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #FF6600, #FF4500)' }}>
                        {status === 'loading' && (
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {status === 'success' && (
                            <span className="text-3xl">✅</span>
                        )}
                        {status === 'error' && (
                            <span className="text-3xl">❌</span>
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        {status === 'loading' && 'Vérification...'}
                        {status === 'success' && 'Email confirmé !'}
                        {status === 'error' && 'Lien invalide'}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">{message}</p>
                </div>

                {status === 'success' && (
                    <div className="space-y-3">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF6600] rounded-full animate-[progress_3s_linear_forwards]"
                                style={{ animation: 'width 3s linear forwards', width: '100%' }} />
                        </div>
                        <p className="text-xs text-gray-400">Redirection automatique dans 3 secondes...</p>
                        <Link
                            href="/dashboard"
                            className="block w-full py-3 bg-[#FF6600] text-white font-bold rounded-2xl hover:bg-[#e55c00] transition-colors"
                        >
                            Accéder à mon Tableau de Bord →
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Retournez sur l'application et demandez un nouvel email de vérification depuis votre tableau de bord.
                        </p>
                        <Link
                            href="/login"
                            className="block w-full py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                )}

                <p className="mt-8 text-xs text-gray-300">
                    Données chiffrées • Racines+ MVP
                </p>
            </div>
        </div>
    );
}
