"use client";

import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Login() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetMode, setResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;

            if (data.user) {
                // Récupérer le rôle pour la redirection
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role || 'user';
                if (role === 'admin') router.push('/admin');
                else if (['cho', 'choa'].includes(role)) router.push('/cho');
                else router.push('/dashboard');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erreur de connexion';
            setError(msg === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect. Vérifiez vos informations.'
                : msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setResetSent(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Fond décoratif */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#FF6600]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-racines-green/5 rounded-full blur-3xl pointer-events-none" />

            {/* Logo */}
            <Link href="/" className="mb-10 hover:opacity-80 transition-opacity">
                <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={140} height={48} className="object-contain" priority />
            </Link>

            <div className="w-full max-w-sm">
                {/* Card avec fond orange */}
                <div className="rounded-3xl shadow-2xl shadow-black/15 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF6600 0%, #FF8C00 40%, #FF4500 100%)' }}>
                    <div className="p-8">
                        {resetMode ? (
                            <>
                                <h1 className="text-2xl font-bold text-white mb-1">Réinitialisation</h1>
                                <p className="text-white/80 text-sm mb-6">Entrez votre email pour recevoir un lien de réinitialisation.</p>

                                {resetSent ? (
                                    <div className="bg-green-500/20 border border-green-400/30 text-white rounded-2xl p-4 text-sm text-center">
                                        ✅ Email envoyé ! Vérifiez votre boîte mail.
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                                                    placeholder="vous@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {error && <div className="bg-red-500/20 border border-red-400/30 text-white text-sm rounded-xl p-3">{error}</div>}
                                        <button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg">
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
                                        </button>
                                    </form>
                                )}

                                <button onClick={() => { setResetMode(false); setResetSent(false); }} className="mt-4 w-full text-white/70 hover:text-white text-sm text-center transition-colors">
                                    ← Retour à la connexion
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">Connexion</h1>
                                        <p className="text-white/70 text-sm">Accès souverain sécurisé</p>
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                            <input
                                                type="email"
                                                id="email"
                                                autoComplete="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                                                placeholder="vous@email.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Mot de passe</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/20 border border-red-400/30 text-white text-sm rounded-xl p-3">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        id="login-submit"
                                        disabled={isLoading || !email || !password}
                                        className="w-full mt-2 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</> : 'Se connecter'}
                                    </button>
                                </form>

                                <button
                                    onClick={() => { setResetMode(true); setError(null); }}
                                    className="mt-4 w-full text-white/70 hover:text-white text-sm text-center transition-colors"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Lien inscription */}
                <p className="text-center text-sm text-foreground/60 mt-6">
                    Pas encore de compte ?{' '}
                    <Link href="/onboarding" className="text-[#FF6600] font-bold hover:underline">
                        Créer mon profil
                    </Link>
                </p>
            </div>

            {/* Badge sécurité */}
            <div className="mt-8 flex items-center gap-2 text-xs text-foreground/40 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6600]/50" />
                Données chiffrées • Souveraineté africaine • Racines+ MVP
            </div>
        </div>
    );
}
