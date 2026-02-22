"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Camera, ShieldCheck, MapPin, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Onboarding() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        villageOrigin: 'Toa-Zéo',
        quartierNom: '',
        residenceCountry: 'CI',
        email: '',
        password: ''
    });

    const [quartiers, setQuartiers] = useState<{ id: string; nom: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Charger les quartiers depuis Supabase selon le village
    useEffect(() => {
        const loadQuartiers = async () => {
            if (!formData.villageOrigin) return;
            // Chercher le village par nom
            const { data: village } = await supabase
                .from('villages')
                .select('id')
                .eq('nom', formData.villageOrigin)
                .single();
            if (!village) return;
            const { data: qs } = await supabase
                .from('quartiers')
                .select('id, nom')
                .eq('village_id', village.id);
            setQuartiers(qs || []);
        };
        loadQuartiers();
    }, [formData.villageOrigin, supabase]);

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        birth_date: formData.birthDate || null,
                        gender: formData.gender,
                        village_origin: formData.villageOrigin,
                        quartier_nom: formData.quartierNom || null,
                        residence_country: formData.residenceCountry,
                        is_founder: true,
                        role: 'user',
                        status: 'pending'
                    });

                if (profileError) console.warn("Profile update warning:", profileError);
            }

            router.push('/dashboard');

        } catch (err: unknown) {
            console.error("Erreur d'inscription:", err);
            const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { num: 1, label: 'Identité' },
        { num: 2, label: 'Origines' },
        { num: 3, label: 'Sécurité' },
    ];

    return (
        <div className="min-h-screen relative flex flex-col bg-background">

            {/* Fond décoratif animé */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative w-full max-w-4xl mx-auto flex justify-between items-center z-10 px-6 pt-8 mb-8">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={110} height={38} className="object-contain" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium bg-foreground/5 px-4 py-2 rounded-full backdrop-blur-sm border border-black/10 dark:border-white/20">
                    <ShieldCheck className="w-4 h-4 text-[#FF6600]" />
                    Données souveraines cryptées
                </div>
            </header>

            {/* Main Content */}
            <main className="relative flex-1 flex flex-col items-center w-full max-w-4xl mx-auto z-10 px-6 pb-12">

                {/* Stepper */}
                <div className="w-full max-w-sm mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${step > s.num ? 'bg-[#FF6600]/10 text-[#FF6600] border-[#FF6600]' : step === s.num ? 'bg-[#FF6600] text-white border-[#FF6600] shadow-lg shadow-[#FF6600]/30 scale-110' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                        {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${step >= s.num ? 'text-foreground' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full overflow-hidden bg-gray-200">
                                        <div className="h-full bg-[#FF6600] transition-all duration-500" style={{ width: step > s.num ? '100%' : '0%' }} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #FF6600 0%, #FF8C00 40%, #FF4500 100%)' }}>

                    {/* STEP 1 : Identité */}
                    {step === 1 && (
                        <form className="p-8" onSubmit={e => e.preventDefault()}>
                            <h1 className="text-2xl font-bold mb-1 text-white">Qui êtes-vous ?</h1>
                            <p className="text-white/80 mb-6 text-sm">Le premier nœud de l&apos;Arbre, c&apos;est vous.</p>

                            <div className="flex justify-center mb-6">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-white/80 cursor-pointer hover:bg-white/20 hover:border-white hover:text-white transition-all group">
                                    <Camera className="w-7 h-7 mb-0.5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Photo</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Prénoms</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData('firstName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white placeholder:text-gray-300 text-gray-900 font-medium"
                                            placeholder="Koffi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Nom</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white placeholder:text-gray-300 text-gray-900 font-medium"
                                            placeholder="Oulaï"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Date de naissance</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => updateFormData('birthDate', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-700"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-2">Sexe</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Homme', 'Femme'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => updateFormData('gender', g)}
                                                className={`py-3 rounded-2xl border-2 text-sm font-bold transition-all ${formData.gender === g ? 'border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-[#FF6600]/40 hover:bg-orange-50'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={!formData.firstName || !formData.lastName}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Continuer <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    )}

                    {/* STEP 2 : Origines */}
                    {step === 2 && (
                        <form className="p-8" onSubmit={e => e.preventDefault()}>
                            <button type="button" onClick={() => setStep(1)} className="mb-4 p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Vos Racines</h1>
                                    <p className="text-white/80 text-sm">Village d&apos;origine pour la cartographie.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Village d&apos;origine</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF6600]/60 pointer-events-none" />
                                        <select
                                            value={formData.villageOrigin}
                                            onChange={(e) => updateFormData('villageOrigin', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium appearance-none"
                                        >
                                            <option value="Toa-Zéo">Toa-Zéo (Pilote actif)</option>
                                            <option value="autre" disabled>D&apos;autres villages arrivent bientôt...</option>
                                        </select>
                                    </div>
                                    <p className="text-[11px] font-semibold text-white mt-2 flex items-center gap-1.5 opacity-90">
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block"></span>
                                        Pilote Toa-Zéo actif &mdash; zone prioritaire
                                    </p>
                                </div>

                                {/* Sélection du quartier */}
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Quartier</label>
                                    <select
                                        value={formData.quartierNom}
                                        onChange={(e) => updateFormData('quartierNom', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 appearance-none"
                                    >
                                        <option value="">-- Sélectionnez un quartier --</option>
                                        {quartiers.map(q => (
                                            <option key={q.id} value={q.nom}>{q.nom}</option>
                                        ))}
                                        {quartiers.length === 0 && <option value="" disabled>Chargement des quartiers...</option>}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Pays de résidence actuel</label>
                                    <select
                                        value={formData.residenceCountry}
                                        onChange={(e) => updateFormData('residenceCountry', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900"
                                    >
                                        <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                                        <option value="FR">🇫🇷 France (Diaspora)</option>
                                        <option value="US">🇺🇸 États-Unis (Diaspora)</option>
                                        <option value="OTHER">🌍 Autre pays</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={!formData.villageOrigin}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Étape finale <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    )}

                    {/* STEP 3 : Sécurité */}
                    {step === 3 && (
                        <form className="p-8" onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                            <button type="button" onClick={() => setStep(2)} disabled={isLoading} className="mb-4 p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 disabled:opacity-40">
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Sécurité</h1>
                                    <p className="text-white/80 text-sm">Votre arbre, privé et souverain.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Email Souverain</label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium"
                                        placeholder="vous@email.com"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Mot de passe souverain</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={(e) => updateFormData('password', e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-8 p-2 text-gray-400 hover:text-[#FF6600] transition-colors rounded-xl hover:bg-orange-50"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <p className="text-xs text-white/70 mt-1.5 flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-white/30'}`} />
                                        {formData.password.length >= 6 ? '✓ Mot de passe valide' : 'Minimum 6 caractères'}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !formData.email || formData.password.length < 6}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Chiffrement souverain...</>
                                ) : (
                                    <>S&apos;inscrire et Lancer le Graphe <ShieldCheck className="w-5 h-5" /></>
                                )}
                            </button>

                            <p className="text-xs text-white/80 mt-5 text-center leading-relaxed">
                                En créant ce profil, vous devenez le <span className="font-semibold text-white">Nœud Fondateur</span> autour duquel les branches de <span className="font-semibold">{formData.villageOrigin || 'Toa-Zéo'}</span> vont être construites.
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
