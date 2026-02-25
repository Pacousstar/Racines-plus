"use client";

import React, { useState, useRef } from 'react';
import { X, Mail, Phone, Send, CheckCircle, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
    const [form, setForm] = useState({ nom: '', email: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Envoi via EmailJS en tâche de fond
            // Pour que cela marche en production, il faut créer ces clés sur EmailJS
            const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_racines';
            const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_contact';
            const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'public_key';

            // Paramètres envoyés au template EmailJS
            const templateParams = {
                from_name: form.nom,
                from_email: form.email,
                to_email: 'pacousstar03@gmail.com',
                message: form.message,
            };

            await emailjs.send(serviceID, templateID, templateParams, publicKey);
            setIsSent(true);
            setForm({ nom: '', email: '', message: '' });
        } catch {
            setError("Une erreur est survenue. Contactez-nous directement par téléphone.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        >
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#FF6600] to-amber-500 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Nous contacter</h2>
                            <p className="text-white/80 text-xs">Racines+ — Village de Toa-Zéo</p>
                        </div>
                    </div>
                </div>

                {/* Corps */}
                <div className="p-6">
                    {isSent ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Message envoyé !</h3>
                            <p className="text-sm text-gray-500 mb-6">Nous avons bien reçu votre message et reviendrons vers vous très vite à l'adresse fournie.</p>
                            <button
                                onClick={() => { setIsSent(false); onClose(); }}
                                className="bg-[#FF6600] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e55c00] transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Votre nom *
                                </label>
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                                    required
                                    placeholder="Jean Kouassi"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Votre email *
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                    placeholder="jean@example.com"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Votre message *
                                </label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    required
                                    rows={4}
                                    placeholder="Votre question, suggestion ou demande de renseignement..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] transition-all resize-none"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#FF6600] hover:bg-[#e55c00] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF6600]/25"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Envoyer le message</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Coordonnées */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center mb-2 font-semibold uppercase tracking-wider">Contact direct</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-[#FF6600] flex-shrink-0" />
                            <a href="tel:+2250707801817" className="hover:text-[#FF6600] transition-colors font-medium">
                                +225 07 07 80 18 17
                            </a>
                            <span className="text-gray-300">·</span>
                            <a href="tel:+2250544814924" className="hover:text-[#FF6600] transition-colors font-medium">
                                05 44 81 49 24
                            </a>
                        </div>
                        <div className="text-center mt-2">
                            <a href="mailto:pacousstar03@gmail.com" className="text-xs text-gray-500 hover:text-[#FF6600] transition-colors">pacousstar03@gmail.com</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
