"use client";

import React, { useState } from 'react';
import { X, UserPlus, Loader2, Shield, BookOpen, Users } from 'lucide-react';

interface AddAncestorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    villageNom: string;
    refreshTree?: () => void;
}

const RELATION_OPTIONS = [
    { value: 'Père', label: '👨 Père', color: 'border-blue-500 bg-blue-50 text-blue-700' },
    { value: 'Mère', label: '👩 Mère', color: 'border-[#FF6600] bg-orange-50 text-[#FF6600]' },
    { value: 'Enfant', label: '👶 Enfant', color: 'border-green-500 bg-green-50 text-green-700' },
    { value: 'Conjoint(e)', label: '💍 Conjoint(e)', color: 'border-pink-500 bg-pink-50 text-pink-700' },
    { value: 'Frère / Sœur', label: '👫 Frère / Sœur', color: 'border-purple-500 bg-purple-50 text-purple-700' },
    { value: 'Demi-frère / Demi-sœur', label: '👥 Demi-frère/sœur', color: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
    { value: 'Oncle / Tante', label: '🧓 Oncle / Tante', color: 'border-amber-500 bg-amber-50 text-amber-700' },
    { value: 'Cousin(e)', label: '🤝 Cousin(e)', color: 'border-teal-500 bg-teal-50 text-teal-700' },
    { value: 'Neveu / Nièce', label: '👶 Neveu / Nièce', color: 'border-cyan-500 bg-cyan-50 text-cyan-700' },
];

const RELIABILITY_OPTIONS = [
    { value: 'confirme', label: '✅ Confirmé', desc: 'Source solide (acte, archive)', color: 'border-green-500 bg-green-50 text-green-700' },
    { value: 'probable', label: '🔶 Probable', desc: 'Indices forts (témoignage)', color: 'border-amber-500 bg-amber-50 text-amber-700' },
    { value: 'en_cours', label: '🕐 En cours', desc: 'À vérifier', color: 'border-gray-400 bg-gray-50 text-gray-600' },
];

export default function AddAncestorModal({ isOpen, onClose, onSuccess, villageNom, refreshTree }: AddAncestorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        relation: 'Père',
        firstName: '',
        lastName: '',
        birthYear: '',
        status: 'Vivant',
        reliability: 'en_cours',
        sourceType: '',
        sourceRef: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/ancestors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Erreur lors de l'ajout");
            }

            if (onSuccess) onSuccess();
            if (refreshTree) refreshTree();
            onClose();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedRelation = RELATION_OPTIONS.find(r => r.value === formData.relation);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF6600]/10 text-[#FF6600] rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Ajouter à l'Arbre</h2>
                            <p className="text-xs text-gray-500">Village : {villageNom}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulaire */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <form id="add-ancestor-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* 1. Type de relation */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                                <Users className="w-3.5 h-3.5 inline mr-1.5" />
                                Relation avec vous <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {RELATION_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`border-2 rounded-2xl px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all text-sm font-semibold ${formData.relation === opt.value
                                            ? opt.color + ' border-current'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio" name="relation" value={opt.value} className="hidden"
                                            checked={formData.relation === opt.value}
                                            onChange={() => setFormData({ ...formData, relation: opt.value })}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 2. Identité */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Prénom(s) <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all"
                                    placeholder="Ex: Jean-Claude"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nom <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all"
                                    placeholder="Ex: Kalou"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Année de naissance (approx.)</label>
                                <input
                                    type="number" value={formData.birthYear}
                                    onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] outline-none transition-all"
                                    placeholder="Ex: 1952"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] outline-none transition-all bg-white"
                                >
                                    <option value="Vivant">Vivant(e)</option>
                                    <option value="Décédé">Décédé(e)</option>
                                    <option value="Victime crise 2010">Victime crise 2010</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Niveau de fiabilité */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                                <Shield className="w-3.5 h-3.5 inline mr-1.5" />
                                Fiabilité de cette information
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {RELIABILITY_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`border-2 rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-all ${formData.reliability === opt.value
                                            ? opt.color + ' border-current'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio" name="reliability" value={opt.value} className="hidden"
                                            checked={formData.reliability === opt.value}
                                            onChange={() => setFormData({ ...formData, reliability: opt.value })}
                                        />
                                        <span className="text-sm font-bold">{opt.label}</span>
                                        <span className="text-[10px] mt-0.5 opacity-80">{opt.desc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 4. Source */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                                <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
                                Source (recommandé)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <select
                                        value={formData.sourceType}
                                        onChange={e => setFormData({ ...formData, sourceType: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6600] outline-none bg-white text-sm text-gray-700"
                                    >
                                        <option value="">-- Type de source --</option>
                                        <option value="oral">Témoignage oral</option>
                                        <option value="archive">Archive publique</option>
                                        <option value="acte">Acte d'état civil</option>
                                        <option value="religieux">Document religieux</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="text" value={formData.sourceRef}
                                        onChange={e => setFormData({ ...formData, sourceRef: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6600] outline-none text-sm text-gray-700"
                                        placeholder="Référence, lien, note..."
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 bg-gray-50 sticky bottom-0 z-10 flex gap-3">
                    <button
                        type="button" onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit" form="add-ancestor-form"
                        disabled={isLoading || !formData.firstName || !formData.lastName}
                        className="flex-[2] bg-[#FF6600] hover:bg-[#e55c00] disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF6600]/20 hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Ajout au Graphe...</>
                        ) : (
                            <><UserPlus className="w-5 h-5" /> Ajouter — {selectedRelation?.label}</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
