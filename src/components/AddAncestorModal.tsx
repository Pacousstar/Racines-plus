"use client";

import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface AddAncestorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddAncestorModal({ isOpen, onClose, onSuccess }: AddAncestorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        relation: 'Père',
        firstName: '',
        lastName: '',
        birthYear: '',
        status: 'Vivante', // ou Décédée
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/ancestors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Erreur lors de l'ajout");
            }

            const data = await response.json();
            console.log('Ancêtre ajouté avec succès:', data.ancestor);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header Modal */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-racines-green/10 text-racines-green rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Ajouter un parent</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulaire */}
                <div className="p-6 overflow-y-auto">
                    <form id="add-ancestor-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Relation */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Relation avec vous</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`border rounded-2xl p-3 flex items-center justify-center cursor-pointer transition-all ${formData.relation === 'Père' ? 'border-racines-green bg-racines-green/5 text-racines-green font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                    <input type="radio" name="relation" value="Père" className="hidden" checked={formData.relation === 'Père'} onChange={(e) => setFormData({ ...formData, relation: e.target.value })} />
                                    Père
                                </label>
                                <label className={`border rounded-2xl p-3 flex items-center justify-center cursor-pointer transition-all ${formData.relation === 'Mère' ? 'border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600] font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                    <input type="radio" name="relation" value="Mère" className="hidden" checked={formData.relation === 'Mère'} onChange={(e) => setFormData({ ...formData, relation: e.target.value })} />
                                    Mère
                                </label>
                            </div>
                        </div>

                        {/* Identité */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Prénom</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-racines-green focus:ring-2 focus:ring-racines-green/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ex: Koffi"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nom</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-racines-green focus:ring-2 focus:ring-racines-green/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ex: Oulaï"
                                />
                            </div>
                        </div>

                        {/* Année et Statut */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Année d. nais. (aprx)</label>
                                <input
                                    type="number"
                                    value={formData.birthYear}
                                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-racines-green focus:ring-2 focus:ring-racines-green/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ex: 1950"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-racines-green focus:ring-2 focus:ring-racines-green/20 outline-none transition-all bg-white"
                                >
                                    <option value="Vivante">Personne vivante</option>
                                    <option value="Décédée">Personne décédée</option>
                                </select>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 p-6 bg-gray-50 sticky bottom-0 z-10 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="add-ancestor-form"
                        disabled={isLoading || !formData.firstName || !formData.lastName}
                        className="flex-[2] bg-racines-green hover:bg-racines-light disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-racines-green/20 hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Ajout au Graphe...</>
                        ) : (
                            "Ajouter à l'Arbre"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
