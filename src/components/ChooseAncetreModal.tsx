"use client";

import React, { useState, useEffect } from 'react';
import { TreePine, X, Search, CheckCircle, Clock, ChevronRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Ancetre {
    id: string;
    nom_complet: string;
    periode: string;
    source: string;
    is_certified: boolean;
    village_id: string;
}

interface ChooseAncetreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (ancetreId: string, ancetreNom: string) => void;
    villageNom?: string;
    userId?: string;
}

export default function ChooseAncetreModal({
    isOpen,
    onClose,
    onSelect,
    villageNom = 'Toa-Zéo',
    userId
}: ChooseAncetreModalProps) {
    const supabase = createClient();
    const [ancestres, setAncestres] = useState<Ancetre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            setIsLoading(true);
            // Chercher les ancêtres du village de l'utilisateur
            const { data: village } = await supabase
                .from('villages')
                .select('id')
                .eq('nom', villageNom)
                .single();

            if (village) {
                const { data } = await supabase
                    .from('ancestres')
                    .select('*')
                    .eq('village_id', village.id)
                    .order('created_at', { ascending: false });
                setAncestres(data || []);
            }
            setIsLoading(false);
        };
        load();
    }, [isOpen, villageNom, supabase]);

    const [positionResult, setPositionResult] = useState<{
        generation: number;
        lien_probable: string;
        confidence: number;
        resume: string;
    } | null>(null);

    const handleConfirm = async () => {
        if (!selected) return;
        setConfirming(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Appel à l'API de positionnement IA
            try {
                const res = await fetch('/api/genealogy/position', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profil_id: user.id,
                        ancetre_id: selected,
                        village_nom: villageNom,
                    }),
                });
                const data = await res.json();
                if (data.success && data.position) {
                    setPositionResult(data.position);
                    const sel = ancestres.find(a => a.id === selected);
                    onSelect(selected, sel?.nom_complet || '');
                    // Ne pas fermer immédiatement → afficher le résultat IA
                    setConfirming(false);
                    return;
                }
            } catch {
                // Fallback silencieux : continuer sans positionnement
            }
            // Fallback : simple mise à jour sans IA
            await supabase.from('profiles').update({ ancestral_root_id: selected }).eq('id', user.id);
            const sel = ancestres.find(a => a.id === selected);
            onSelect(selected, sel?.nom_complet || '');
        }
        setConfirming(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#FF6600] to-[#cc5200] p-6 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <TreePine className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Choisir mon Ancêtre</h2>
                            <p className="text-white/80 text-sm">Village de {villageNom}</p>
                        </div>
                    </div>
                </div>

                {/* Corps */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        Sélectionnez l&apos;ancêtre fondateur auquel vous vous rattachez.
                        L&apos;IA de Racines+ positionnera ensuite votre lignée dans l&apos;arbre général du village.
                    </p>

                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-8 h-8 border-2 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && ancestres.length === 0 && (
                        <div className="text-center py-10 px-4">
                            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-7 h-7 text-[#FF6600]" />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Ancêtre non encore inscrit</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Le Chief Heritage Officer (CHO) de {villageNom} n&apos;a pas encore enregistré l&apos;ancêtre fondateur.
                                Vous serez notifié dès que ce sera fait.
                            </p>
                            <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold px-4 py-2 rounded-full w-fit mx-auto">
                                <Clock className="w-3.5 h-3.5" /> En attente du CHO
                            </div>
                        </div>
                    )}

                    {!isLoading && ancestres.length > 0 && (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {ancestres.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelected(a.id)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selected === a.id
                                        ? 'border-[#FF6600] bg-orange-50'
                                        : 'border-gray-100 hover:border-[#FF6600]/40 hover:bg-orange-50/30'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === a.id ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300'}`}>
                                                {selected === a.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">{a.nom_complet}</h4>
                                                {a.periode && <p className="text-xs text-gray-500 mt-0.5">⏳ {a.periode}</p>}
                                                {a.source && <p className="text-xs text-gray-400 mt-0.5">📖 {a.source}</p>}
                                            </div>
                                        </div>
                                        {a.is_certified && (
                                            <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                                <CheckCircle className="w-3 h-3" /> Certifié
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Résultat IA de positionnement */}
                {positionResult ? (
                    <div className="p-6 text-center">
                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Ancêtre confirmé !</h3>
                        <p className="text-sm text-gray-500 mb-4">{positionResult.resume}</p>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-amber-600 font-bold">🤖 IA Racines+</span>
                            </div>
                            <p className="text-xs text-gray-600"><strong>Lien estimé :</strong> {positionResult.lien_probable}</p>
                            <p className="text-xs text-gray-600"><strong>Génération :</strong> {positionResult.generation}e</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${positionResult.confidence}%` }} />
                                </div>
                                <span className="text-xs font-bold text-amber-600">{positionResult.confidence}%</span>
                            </div>
                            <p className="text-[10px] text-gray-400">Ce positionnement est une estimation — le CHO pourra l&apos;affiner lors de votre validation.</p>
                        </div>
                        <button onClick={onClose} className="mt-5 w-full bg-[#FF6600] text-white py-3 rounded-2xl font-bold text-sm hover:bg-[#e55c00] transition-colors">
                            Fermer
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Footer */}
                        {ancestres.length > 0 && (
                            <div className="px-6 pb-6 flex gap-3">
                                <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selected || confirming}
                                    className="flex-1 py-3 rounded-2xl bg-[#FF6600] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold hover:bg-[#e55c00] transition-colors flex items-center justify-center gap-2"
                                >
                                    {confirming ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirmer mon ancêtre</>}
                                </button>
                            </div>
                        )}

                        {/* Note IA */}
                        <div className="mx-6 mb-6 bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-base">🤖</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                <strong className="text-gray-700">IA Racines+</strong> — Une fois votre ancêtre sélectionné, l&apos;algorithme analysera vos données pour vous positionner dans la lignée du village.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
