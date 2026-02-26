"use client";

import React, { useState } from 'react';
import { X, UserPlus, Loader2, Baby } from 'lucide-react';

interface AddChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    villageNom: string;
    refreshTree?: () => void;
}

export default function AddChildModal({ isOpen, onClose, onSuccess, villageNom, refreshTree }: AddChildModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        relation: 'Enfant',
        firstName: '',
        lastName: '',
        birthYear: '',
        status: 'Vivante',
        isVictim: false
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header Modal */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Baby className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">+ Ajouter un enfant</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulaire */}
                <div className="p-6 overflow-y-auto">
                    <form id="add-child-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Identité */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Prénom</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Prénom de l'enfant"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nom</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Nom de l'enfant"
                                />
                            </div>
                        </div>

                        {/* Année et Statut */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Année d. nais.</label>
                                <input
                                    type="number"
                                    value={formData.birthYear}
                                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Année"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value, isVictim: e.target.value === 'Vivante' ? false : formData.isVictim })}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                                >
                                    <option value="Vivante">Vivant(e)</option>
                                    <option value="Décédée">Décédé(e)</option>
                                </select>
                            </div>
                        </div>

                        {formData.status === 'Décédée' && (
                            <div className="animate-in fade-in zoom-in duration-200">
                                <label className="flex items-center gap-3 cursor-pointer bg-red-50 border border-red-100 p-4 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVictim}
                                        onChange={e => setFormData({ ...formData, isVictim: e.target.checked })}
                                        className="w-5 h-5 accent-red-600 rounded"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-red-700">Victime crise 2010</p>
                                        <p className="text-[10px] text-red-600 font-medium opacity-80 uppercase tracking-wider">Recensement mémorial</p>
                                    </div>
                                </label>
                            </div>
                        )}

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
                        form="add-child-form"
                        disabled={isLoading || !formData.firstName || !formData.lastName}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
                        ) : (
                            "Ajouter l'enfant"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
