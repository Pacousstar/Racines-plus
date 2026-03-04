"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Camera, ShieldCheck, MapPin, Loader2, Eye, EyeOff, Check, X, ZoomIn, ZoomOut, RotateCcw, Home, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ─────────────────────────────────────
// Composant de recadrage de photo
// ─────────────────────────────────────
interface PhotoCropperProps {
    src: string;
    onConfirm: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

function PhotoCropper({ src, onConfirm, onCancel }: PhotoCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

    const CROP_SIZE = 240;

    const drawPreview = useCallback(() => {
        const canvas = previewRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        // Cercle de crop
        ctx.save();
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const drawX = (CROP_SIZE - scaledW) / 2 + offset.x;
        const drawY = (CROP_SIZE - scaledH) / 2 + offset.y;

        ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        // Bordure
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
    }, [scale, offset]);

    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            imgRef.current = img;
            // Centrer l'image par défaut
            const s = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
            setScale(s);
            drawPreview();
        };
        img.src = src;
    }, [src, drawPreview]);

    useEffect(() => { drawPreview(); }, [drawPreview]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStart.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setOffset({
            x: dragStart.current.ox + (clientX - dragStart.current.x),
            y: dragStart.current.oy + (clientY - dragStart.current.y),
        });
    };

    const handleConfirm = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 128, 0, Math.PI * 2);
        ctx.clip();

        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const drawX = (CROP_SIZE - scaledW) / 2 + offset.x;
        const drawY = (CROP_SIZE - scaledH) / 2 + offset.y;
        // Ratio pour canvas de sortie 256px
        const ratio = 256 / CROP_SIZE;
        ctx.drawImage(img, drawX * ratio, drawY * ratio, scaledW * ratio, scaledH * ratio);
        ctx.restore();

        canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.9);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Recadrer la photo</h3>
                    <button onClick={onCancel} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Zone de preview */}
                <div className="flex justify-center mb-4">
                    <canvas
                        ref={previewRef}
                        width={CROP_SIZE}
                        height={CROP_SIZE}
                        className="rounded-full border-4 border-[#FF6600]/30 cursor-move touch-none"
                        style={{ width: CROP_SIZE, height: CROP_SIZE }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={() => setIsDragging(false)}
                    />
                </div>
                <p className="text-xs text-gray-600 text-center mb-4">Glissez pour repositionner</p>

                {/* Contrôles zoom */}
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <input type="range" min="0.3" max="3" step="0.05" value={scale}
                        onChange={e => setScale(parseFloat(e.target.value))}
                        className="flex-1 accent-[#FF6600]" />
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                        Annuler
                    </button>
                    <button onClick={handleConfirm} className="flex-1 py-3 rounded-2xl bg-[#FF6600] text-white font-bold text-sm hover:bg-[#e55c00] transition-colors shadow-lg shadow-[#FF6600]/25">
                        Confirmer ✓
                    </button>
                </div>

                {/* Canvas caché pour export */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────
// Composant principal Onboarding
// ─────────────────────────────────────
export default function Onboarding() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Photo states
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        villageOrigin: 'Toa-Zéo',
        quartierNom: '',
        residenceCountry: 'CI',
        email: '',
        password: '',
        fatherFirstName: '',
        fatherLastName: '',
        fatherStatus: 'Vivant',
        fatherBirthDate: '',
        motherFirstName: '',
        motherLastName: '',
        motherStatus: 'Vivante',
        motherBirthDate: '',
        phone1: '',
        phone2: '',
        whatsapp1: '',
        whatsapp2: '',
        residenceCountryCustom: '',
        residenceCity: ''
    });

    const [quartiers, setQuartiers] = useState<{ id: string; nom: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadQuartiers = async () => {
            if (!formData.villageOrigin) return;
            const { data: village } = await supabase
                .from('villages').select('id').eq('nom', formData.villageOrigin).single();
            if (!village) return;
            const { data: qs } = await supabase
                .from('quartiers').select('id, nom').eq('village_id', village.id);
            setQuartiers(qs || []);
        };
        loadQuartiers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.villageOrigin]);

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Gestion de la sélection de photo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCropSrc(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        // Reset input pour permettre re-sélection du même fichier
        e.target.value = '';
    };

    const handleCropConfirm = (blob: Blob) => {
        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));
        setCropSrc(null);
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Préparer FormData pour envoyer photo + données texte en une requête
            const fd = new FormData();
            fd.append('email', formData.email);
            fd.append('password', formData.password);
            fd.append('firstName', formData.firstName);
            fd.append('lastName', formData.lastName);
            fd.append('birthDate', formData.birthDate || '');
            fd.append('gender', formData.gender);
            fd.append('villageOrigin', formData.villageOrigin);
            fd.append('quartierNom', formData.quartierNom || '');
            fd.append('residenceCountry', formData.residenceCountry === 'OTHER' ? formData.residenceCountryCustom : formData.residenceCountry);
            fd.append('residenceCity', formData.residenceCity);
            fd.append('phone1', formData.phone1);
            fd.append('phone2', formData.phone2);
            fd.append('whatsapp1', formData.whatsapp1);
            fd.append('whatsapp2', formData.whatsapp2);

            fd.append('fatherFirstName', formData.fatherFirstName);
            fd.append('fatherLastName', formData.fatherLastName);
            fd.append('fatherStatus', formData.fatherStatus);
            fd.append('fatherBirthDate', formData.fatherBirthDate);
            fd.append('motherFirstName', formData.motherFirstName);
            fd.append('motherLastName', formData.motherLastName);
            fd.append('motherStatus', formData.motherStatus);
            fd.append('motherBirthDate', formData.motherBirthDate);

            // Ajouter la photo si présente
            if (photoBlob) {
                const photoFile = new File([photoBlob], 'avatar.jpg', { type: 'image/jpeg' });
                fd.append('photo', photoFile);
            }

            // Appel API server-side (contourne RLS)
            const response = await fetch('/api/register', {
                method: 'POST',
                body: fd,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de l\'inscription');
            }

            // Succès : connexion automatique puis redirection dashboard
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                // L'user est créé mais la connexion auto a échoué → page login
                router.push('/login?registered=1');
            } else {
                router.push('/dashboard');
            }

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
        { num: 3, label: 'Parents' },
        { num: 4, label: 'Sécurité' },
    ];

    return (
        <div className="min-h-screen relative flex flex-col bg-background">

            {/* Recadrage photo */}
            {cropSrc && (
                <PhotoCropper
                    src={cropSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={() => setCropSrc(null)}
                />
            )}

            {/* Fond décoratif */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header avec bouton retour accueil */}
            <header className="relative w-full max-w-4xl mx-auto flex justify-between items-center z-10 px-4 sm:px-6 pt-6 mb-8">
                <div className="flex items-center gap-3">
                    {/* Retour accueil */}
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-semibold text-foreground/60 hover:text-[#FF6600] transition-colors group"
                    >
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 group-hover:bg-[#FF6600]/10 group-hover:text-[#FF6600] transition-all">
                            <Home className="w-4 h-4" />
                        </span>
                        <span className="hidden sm:inline">Retour</span>
                    </Link>
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={100} height={34} className="object-contain" />
                    </Link>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80 font-medium bg-foreground/5 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm border border-black/10 dark:border-white/20">
                    <ShieldCheck className="w-4 h-4 text-[#FF6600]" />
                    <span className="hidden sm:inline">Données souveraines cryptées</span>
                    <span className="sm:hidden">RGPD ✓</span>
                </div>
            </header>

            {/* Main */}
            <main className="relative flex-1 flex flex-col items-center w-full max-w-4xl mx-auto z-10 px-4 sm:px-6 pb-8">

                {/* Stepper */}
                <div className="w-full max-w-sm mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${step > s.num ? 'bg-[#FF6600]/10 text-[#FF6600] border-[#FF6600]' : step === s.num ? 'bg-[#FF6600] text-white border-[#FF6600] shadow-lg shadow-[#FF6600]/30 scale-110' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${step >= s.num ? 'text-foreground' : 'text-gray-600'}`}>{s.label}</span>
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
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg, #FF6600 0%, #FF8C00 40%, #FF4500 100%)' }}>

                    {/* ── STEP 1 : Identité ── */}
                    {step === 1 && (
                        <form className="p-6 sm:p-8" onSubmit={e => e.preventDefault()}>
                            <h1 className="text-2xl font-bold mb-1 text-white">Qui êtes-vous ?</h1>
                            <p className="text-white/80 mb-6 text-sm">Le premier nœud de l&apos;Arbre, c&apos;est vous.</p>

                            {/* Zone photo avec crop */}
                            <div className="flex justify-center mb-6">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div className="relative">
                                    {photoPreview ? (
                                        <div className="relative group">
                                            <img
                                                src={photoPreview}
                                                alt="Aperçu"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-lg"
                                            />
                                            {/* Actions sur la photo */}
                                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                                                    title="Changer"
                                                >
                                                    <Camera className="w-3.5 h-3.5 text-[#FF6600]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setPhotoPreview(null); setPhotoBlob(null); }}
                                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <X className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-white/80 cursor-pointer hover:bg-white/20 hover:border-white hover:text-white transition-all group"
                                        >
                                            <Camera className="w-7 h-7 mb-0.5 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Photo</span>
                                        </button>
                                    )}
                                    {photoPreview && (
                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <Check className="w-4 h-4 text-[#FF6600]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {photoPreview && (
                                <p className="text-center text-[11px] text-white/70 -mt-3 mb-4">
                                    Survolez la photo pour modifier ou supprimer
                                </p>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Prénoms</label>
                                        <input type="text" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white placeholder:text-gray-300 text-gray-900 font-medium"
                                            placeholder="Koffi" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Nom</label>
                                        <input type="text" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white placeholder:text-gray-300 text-gray-900 font-medium"
                                            placeholder="Oulaï" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Date de naissance</label>
                                    <input type="date" value={formData.birthDate} onChange={(e) => updateFormData('birthDate', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all bg-gray-50 hover:bg-white text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-2">Sexe</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Homme', 'Femme'].map(g => (
                                            <button key={g} type="button" onClick={() => updateFormData('gender', g)}
                                                className={`py-3 rounded-2xl border-2 text-sm font-bold transition-all ${formData.gender === g ? 'border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600]' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-[#FF6600]/40'}`}>
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button type="button" onClick={() => setStep(2)} disabled={!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Continuer <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2 : Origines ── */}
                    {step === 2 && (
                        <form className="p-6 sm:p-8" onSubmit={e => e.preventDefault()}>
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
                                        <select value={formData.villageOrigin} onChange={(e) => updateFormData('villageOrigin', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium appearance-none">
                                            <option value="Toa-Zéo">Toa-Zéo (Pilote actif)</option>
                                            <option value="autre" disabled>D&apos;autres villages arrivent bientôt...</option>
                                        </select>
                                    </div>
                                    <p className="text-[11px] font-semibold text-white mt-2 flex items-center gap-1.5 opacity-90">
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                                        Pilote Toa-Zéo actif &mdash; zone prioritaire
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Quartier</label>
                                    <select value={formData.quartierNom} onChange={(e) => updateFormData('quartierNom', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 appearance-none" required>
                                        <option value="">-- Sélectionnez un quartier --</option>
                                        {quartiers.map(q => (<option key={q.id} value={q.nom}>{q.nom}</option>))}
                                        {quartiers.length === 0 && <option value="" disabled>Chargement...</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Pays de résidence</label>
                                    <select value={formData.residenceCountry} onChange={(e) => updateFormData('residenceCountry', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all bg-gray-50 hover:bg-white text-gray-900">
                                        <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                                        <option value="FR">🇫🇷 France (Diaspora)</option>
                                        <option value="US">🇺🇸 États-Unis (Diaspora)</option>
                                        <option value="OTHER">🌍 Autre pays</option>
                                    </select>
                                </div>
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Ville de résidence</label>
                                    <input type="text" value={formData.residenceCity} onChange={(e) => updateFormData('residenceCity', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-white/20 focus:border-white outline-none transition-all bg-black/20 text-white placeholder:text-white/40 font-medium"
                                        placeholder="Ex: Abidjan, Paris, New York..." required />
                                </div>
                                {formData.residenceCountry === 'OTHER' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Précisez le pays</label>
                                        <input type="text" value={formData.residenceCountryCustom} onChange={(e) => updateFormData('residenceCountryCustom', e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-white/20 focus:border-white outline-none transition-all bg-black/20 text-white placeholder:text-white/40 font-medium"
                                            placeholder="Ex: Canada, Belgique..." />
                                    </div>
                                )}

                                <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
                                    <h3 className="text-white font-bold text-sm">Contacts (Obligatoire)</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Téléphone 1</label>
                                                <input type="text" value={formData.phone1} onChange={(e) => updateFormData('phone1', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-xs outline-none focus:border-white" placeholder="+225..." />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Téléphone 2</label>
                                                <input type="text" value={formData.phone2} onChange={(e) => updateFormData('phone2', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-xs outline-none focus:border-white" placeholder="+225..." />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">WhatsApp 1</label>
                                                <input type="text" value={formData.whatsapp1} onChange={(e) => updateFormData('whatsapp1', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-xs outline-none focus:border-white" placeholder="+225..." />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">WhatsApp 2</label>
                                                <input type="text" value={formData.whatsapp2} onChange={(e) => updateFormData('whatsapp2', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-xs outline-none focus:border-white" placeholder="+225..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setStep(3)} disabled={!formData.villageOrigin || !formData.quartierNom || !formData.residenceCity || !formData.phone1 || (formData.residenceCountry === 'OTHER' && !formData.residenceCountryCustom)}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Continuer <ArrowRight className="w-5 h-5" />
                            </button>
                            {!formData.quartierNom && (
                                <p className="text-white/80 text-center text-xs mt-2 font-semibold">⚠️ Le quartier d&apos;origine est obligatoire</p>
                            )}
                        </form>
                    )}

                    {/* ── STEP 3 : Parents ── */}
                    {step === 3 && (
                        <form className="p-6 sm:p-8" onSubmit={e => e.preventDefault()}>
                            <button type="button" onClick={() => setStep(2)} className="mb-4 p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Vos Parents</h1>
                                    <p className="text-white/80 text-sm">Créez le lien avec votre famille.</p>
                                </div>
                            </div>

                            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* PÈRE */}
                                <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><div className="w-2 h-2 bg-[#FF6600] rounded-full"></div> Père</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Prénoms</label>
                                            <input type="text" value={formData.fatherFirstName} onChange={(e) => updateFormData('fatherFirstName', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-sm outline-none focus:border-white" placeholder="Prénoms" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Nom</label>
                                            <input type="text" value={formData.fatherLastName} onChange={(e) => updateFormData('fatherLastName', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-sm outline-none focus:border-white" placeholder="Nom" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Statut du père</label>
                                            <select value={formData.fatherStatus} onChange={(e) => updateFormData('fatherStatus', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white text-sm outline-none focus:border-white [&>option]:text-black">
                                                <option value="Vivant">Vivant</option>
                                                <option value="Décédé">Décédé</option>
                                                <option value="Victime crise 2010">Victime crise 2010</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Date de naissance</label>
                                            <input type="date" value={formData.fatherBirthDate} onChange={(e) => updateFormData('fatherBirthDate', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white text-sm outline-none focus:border-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* MÈRE */}
                                <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Mère</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Prénoms</label>
                                            <input type="text" value={formData.motherFirstName} onChange={(e) => updateFormData('motherFirstName', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-sm outline-none focus:border-white" placeholder="Prénoms" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Nom</label>
                                            <input type="text" value={formData.motherLastName} onChange={(e) => updateFormData('motherLastName', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/30 text-sm outline-none focus:border-white" placeholder="Nom" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Statut de la mère</label>
                                            <select value={formData.motherStatus} onChange={(e) => updateFormData('motherStatus', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white text-sm outline-none focus:border-white [&>option]:text-black">
                                                <option value="Vivante">Vivante</option>
                                                <option value="Décédée">Décédée</option>
                                                <option value="Victime crise 2010">Victime crise 2010</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">Date de naissance</label>
                                            <input type="date" value={formData.motherBirthDate} onChange={(e) => updateFormData('motherBirthDate', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white text-sm outline-none focus:border-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setStep(4)}
                                disabled={!formData.fatherFirstName || !formData.fatherLastName || !formData.fatherStatus || !formData.fatherBirthDate || !formData.motherFirstName || !formData.motherLastName || !formData.motherStatus || !formData.motherBirthDate}
                                className="w-full mt-6 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Étape finale <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    )}

                    {/* ── STEP 4 : Sécurité ── */}
                    {step === 4 && (
                        <form className="p-6 sm:p-8" onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                            <button type="button" onClick={() => setStep(3)} disabled={isLoading} className="mb-4 p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 disabled:opacity-40">
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
                            <div className="p-5 bg-orange-50 dark:bg-[#FF6600]/5 rounded-3xl border border-orange-100 dark:border-[#FF6600]/10 flex gap-4">
                                <ShieldCheck className="w-6 h-6 text-[#FF6600] flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Confidentialité & Souveraineté Africaine</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Vos données sont protégées par les standards RGPD. En validant, vous participez à la construction d&apos;une base de données mémorielle souveraine pour l&apos;Afrique.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Email</label>
                                    <input type="email" autoComplete="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium"
                                        placeholder="vous@email.com" />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-white/90 uppercase tracking-wide mb-1">Mot de passe</label>
                                    <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all bg-gray-50 hover:bg-white text-gray-900 font-medium"
                                        placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-8 p-2 text-gray-600 hover:text-[#FF6600] transition-colors rounded-xl hover:bg-orange-50">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <p className="text-xs text-white/70 mt-1.5 flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-white/30'}`} />
                                        {formData.password.length >= 6 ? '✓ Mot de passe valide' : 'Minimum 6 caractères'}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>
                            )}

                            <button type="submit" disabled={isLoading || !formData.email || formData.password.length < 6}
                                className="w-full mt-8 bg-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed hover:bg-gray-100 text-[#FF6600] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Chiffrement souverain...</>
                                ) : (
                                    <>S&apos;inscrire et Lancer le Graphe <ShieldCheck className="w-5 h-5" /></>
                                )}
                            </button>

                            <p className="text-xs text-white/80 mt-5 text-center leading-relaxed">
                                En créant ce profil, vous devenez le <span className="font-semibold text-white">Nœud familial</span> autour duquel les branches de <span className="font-semibold">{formData.villageOrigin || 'Toa-Zéo'}</span> vont être construites.
                            </p>
                        </form>
                    )}
                </div>

                {/* Mention RGPD en bas */}
                <p className="mt-6 text-center text-xs text-foreground/40 leading-relaxed max-w-sm bg-black/5 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/10">
                    Données chiffrées • Souveraineté Africaine • Racines+ MVP
                    <br />
                    <span className="text-foreground/30 font-medium">Validation des données respectée avec application des règles RGPD en vigueur</span>
                </p>
            </main>
        </div>
    );
}
