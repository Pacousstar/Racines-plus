"use client";

import React, { useState, useEffect } from 'react';
import { X, UserCog, Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export interface ExtendedProfileData {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    niveauEtudes: string;
    diplomes: string;
    emploi: string;
    fonction: string;
    retraite: boolean;
    nombreEnfants: number;
    adresseResidence: string;
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ExtendedProfileData;
    userId: string;
}

export default function EditProfileModal({ isOpen, onClose, onSuccess, initialData, userId }: EditProfileModalProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    // Valeurs par défaut vides
    const [formData, setFormData] = useState<ExtendedProfileData>({
        firstName: '',
        lastName: '',
        gender: '',
        birthDate: '',
        niveauEtudes: '',
        diplomes: '',
        emploi: '',
        fonction: '',
        retraite: false,
        nombreEnfants: 0,
        adresseResidence: ''
    });

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData(initialData);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    gender: formData.gender,
                    birth_date: formData.birthDate || null,
                    niveau_etudes: formData.niveauEtudes,
                    diplomes: formData.diplomes,
                    emploi: formData.emploi,
                    fonction: formData.fonction,
                    retraite: formData.retraite,
                    nombre_enfants: formData.nombreEnfants,
                    adresse_residence: formData.adresseResidence
                })
                .eq('id', userId);

            if (error) throw error;

            console.log('Profil mis à jour avec succès');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour du profil.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header Modal */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF6600]/10 text-[#FF6600] rounded-full flex items-center justify-center">
                            <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Éditer mon profil complet</h2>
                            <p className="text-xs text-gray-500">Mettez à jour vos informations pour l'arbre généalogique</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulaire scrollable */}
                <div className="p-6 overflow-y-auto">
                    <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Identité de base */}
                        <div>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">1. Identité</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Prénom</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all placeholder:text-gray-400" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nom</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all placeholder:text-gray-400" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Sexe</label>
                                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white">
                                        <option value="">Non précisé</option>
                                        <option value="H">Homme</option>
                                        <option value="F">Femme</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Date de naissance</label>
                                    <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all text-gray-700" />
                                </div>
                            </div>
                        </div>

                        {/* Éducation & Vie PRO */}
                        <div>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">2. Éducation & Situation Professionnelle</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Niveau d'études</label>
                                    <select value={formData.niveauEtudes} onChange={e => setFormData({ ...formData, niveauEtudes: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white">
                                        <option value="">Sélectionner</option>
                                        <option value="Aucun">Aucun</option>
                                        <option value="Primaire">Primaire</option>
                                        <option value="Secondaire">Secondaire / Lycée</option>
                                        <option value="Baccalauréat">Baccalauréat</option>
                                        <option value="Universitaire (Licence/Master/Doctorat)">Universitaire (Licence/Master/Doctorat)</option>
                                        <option value="Professionnel">Formation Professionnelle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Diplômes obtenus</label>
                                    <input type="text" value={formData.diplomes} onChange={e => setFormData({ ...formData, diplomes: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="Ex: Licence en Droit, BTS Com..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Emploi actuel</label>
                                    <input type="text" value={formData.emploi} onChange={e => setFormData({ ...formData, emploi: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="Ex: Enseignant, Agriculteur..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Fonction / Titre</label>
                                    <input type="text" value={formData.fonction} onChange={e => setFormData({ ...formData, fonction: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="Ex: Chef de service, Gérant..." />
                                </div>
                                <div className="md:col-span-2 mt-2">
                                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                                        <input type="checkbox" checked={formData.retraite} onChange={e => setFormData({ ...formData, retraite: e.target.checked })} className="w-5 h-5 accent-[#FF6600] rounded" />
                                        <span className="text-sm font-semibold text-gray-700">Je suis actuellement à la retraite</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Famille & Résidence */}
                        <div>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">3. Famille & Résidence</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nombre d'enfants</label>
                                    <input type="number" min="0" value={formData.nombreEnfants} onChange={e => setFormData({ ...formData, nombreEnfants: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Adresse de Résidence actuelle</label>
                                    <textarea value={formData.adresseResidence} onChange={e => setFormData({ ...formData, adresseResidence: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all resize-none" placeholder="Pays, Ville, Quartier, Précisions..."></textarea>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 p-6 bg-gray-50 sticky bottom-0 z-10 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="edit-profile-form"
                        disabled={isLoading}
                        className="flex-[2] bg-[#FF6600] hover:bg-[#e55c00] disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF6600]/20 hover:-translate-y-0.5"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
                        ) : (
                            <><Save className="w-5 h-5" /> Enregistrer mes infos</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
