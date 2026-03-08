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
    residenceCity: string;
    residenceCountry: string;
    phone1?: string;
    phone2?: string;
    whatsapp1?: string;
    whatsapp2?: string;
    village_origin?: string;
    quartier_nom?: string;
    metadata?: {
        father_first_name?: string;
        father_last_name?: string;
        father_birth_date?: string;
        mother_first_name?: string;
        mother_last_name?: string;
        mother_birth_date?: string;
        [key: string]: any;
    };
    detailsEnfants?: Array<{
        id: string;
        firstName: string;
        lastName: string;
        birthDate: string;
        gender: string;
        isDeceased?: boolean;
        isVictime2010?: boolean;
    }>;
    consentementEnfants?: boolean;
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ExtendedProfileData;
    userId: string;
}

interface Village {
    id: string;
    nom: string;
}

interface Quartier {
    id: string;
    village_id: string;
    nom: string;
}

export default function EditProfileModal({ isOpen, onClose, onSuccess, initialData, userId }: EditProfileModalProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [villages, setVillages] = useState<Village[]>([]);
    const [quartiers, setQuartiers] = useState<Quartier[]>([]);
    const [filteredQuartiers, setFilteredQuartiers] = useState<Quartier[]>([]);

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
        adresseResidence: '',
        residenceCity: '',
        residenceCountry: 'CI',
        phone1: '',
        phone2: '',
        whatsapp1: '',
        whatsapp2: '',
        village_origin: '',
        quartier_nom: '',
        detailsEnfants: [],
        metadata: {
            father_first_name: '',
            father_last_name: '',
            father_birth_date: '',
            mother_first_name: '',
            mother_last_name: '',
            mother_birth_date: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            fetchVillagesAndQuartiers();
        }
    }, [isOpen]);

    const fetchVillagesAndQuartiers = async () => {
        try {
            const [vRes, qRes] = await Promise.all([
                supabase.from('villages').select('id, nom'),
                supabase.from('quartiers').select('id, village_id, nom')
            ]);
            if (vRes.data) setVillages(vRes.data);
            if (qRes.data) setQuartiers(qRes.data);
        } catch (err) {
            console.error("Error fetching villages/quartiers:", err);
        }
    };

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                ...initialData,
                metadata: {
                    father_first_name: '',
                    father_last_name: '',
                    father_birth_date: '',
                    mother_first_name: '',
                    mother_last_name: '',
                    mother_birth_date: '',
                    ...(initialData.metadata || {})
                }
            });
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (formData.village_origin) {
            const village = villages.find(v => v.nom === formData.village_origin);
            if (village) {
                setFilteredQuartiers(quartiers.filter(q => q.village_id === village.id));
            } else {
                setFilteredQuartiers([]);
            }
        } else {
            setFilteredQuartiers([]);
        }
    }, [formData.village_origin, villages, quartiers]);

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
                    adresse_residence: formData.adresseResidence,
                    residence_city: formData.residenceCity,
                    residence_country: formData.residenceCountry,
                    phone_1: formData.phone1,
                    phone_2: formData.phone2,
                    whatsapp_1: formData.whatsapp1,
                    whatsapp_2: formData.whatsapp2,
                    village_origin: formData.village_origin,
                    quartier_nom: formData.quartier_nom,
                    metadata: formData.metadata,
                    details_enfants: formData.detailsEnfants
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
                            <p className="text-xs text-gray-600">Mettez à jour vos informations pour l'arbre généalogique</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
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
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Prénoms</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all placeholder:text-gray-400" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nom de famille</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all placeholder:text-gray-400" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Sexe <span className="text-red-500">*</span></label>
                                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white" required>
                                        <option value="">Sélectionner</option>
                                        <option value="Homme">Homme</option>
                                        <option value="Femme">Femme</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Date de naissance <span className="text-red-500">*</span></label>
                                    <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all text-gray-700" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Village d'origine <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.village_origin}
                                        onChange={e => setFormData({ ...formData, village_origin: e.target.value, quartier_nom: '' })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Sélectionner un village</option>
                                        {villages.map(v => (
                                            <option key={v.id} value={v.nom}>{v.nom}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Quartier <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.quartier_nom}
                                        onChange={e => setFormData({ ...formData, quartier_nom: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white disabled:opacity-50"
                                        required
                                        disabled={!formData.village_origin}
                                    >
                                        <option value="">Sélectionner un quartier</option>
                                        {filteredQuartiers.map(q => (
                                            <option key={q.id} value={q.nom}>{q.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Lignée Héritage */}
                        <div>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">2. Lignée & Héritage (Indispensable pour l'IA)</h3>
                            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Lignée Paternelle</p>
                                <div className="space-y-3">
                                    <input type="text" value={formData.metadata?.father_first_name || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, father_first_name: e.target.value } })} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF6600]" placeholder="Prénom du Père" required />
                                    <input type="text" value={formData.metadata?.father_last_name || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, father_last_name: e.target.value } })} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF6600]" placeholder="Nom du Père" required />
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date de naissance <span className="text-red-500">*</span></label>
                                        <input type="date" value={formData.metadata?.father_birth_date || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, father_birth_date: e.target.value } })} className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs outline-none focus:border-[#FF6600]" required />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Lignée Maternelle</p>
                                <div className="space-y-3">
                                    <input type="text" value={formData.metadata?.mother_first_name || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, mother_first_name: e.target.value } })} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF6600]" placeholder="Prénom de la Mère" required />
                                    <input type="text" value={formData.metadata?.mother_last_name || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, mother_last_name: e.target.value } })} className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF6600]" placeholder="Nom de la Mère" required />
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date de naissance <span className="text-red-500">*</span></label>
                                        <input type="date" value={formData.metadata?.mother_birth_date || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, mother_birth_date: e.target.value } })} className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs outline-none focus:border-[#FF6600]" required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Éducation & Vie PRO */}
                        <div>
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">3. Éducation & Situation Professionnelle</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Niveau d'études <span className="text-red-500">*</span></label>
                                    <select value={formData.niveauEtudes} onChange={e => setFormData({ ...formData, niveauEtudes: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white" required>
                                        <option value="">Sélectionner</option>
                                        <option value="Aucun">Aucun</option>
                                        <option value="Primaire">Primaire</option>
                                        <option value="Secondaire">Secondaire</option>
                                        <option value="Lycée">Lycée</option>
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
                            <h3 className="text-sm font-bold border-b pb-2 mb-4 text-[#FF6600]">4. Famille & Résidence</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Nombre d&apos;enfants (total enregistré)</label>
                                    <input type="number" min="0" value={formData.nombreEnfants} onChange={e => setFormData({ ...formData, nombreEnfants: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Pays de résidence <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.residenceCountry}
                                        onChange={e => setFormData({ ...formData, residenceCountry: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                                        <option value="FR">🇫🇷 France</option>
                                        <option value="BE">🇧🇪 Belgique</option>
                                        <option value="CH">🇨🇭 Suisse</option>
                                        <option value="CA">🇨🇦 Canada</option>
                                        <option value="US">🇺🇸 États-Unis</option>
                                        <option value="GB">🇬🇧 Royaume-Uni</option>
                                        <option value="SN">🇸🇳 Sénégal</option>
                                        <option value="ML">🇲🇱 Mali</option>
                                        <option value="BF">🇧🇫 Burkina Faso</option>
                                        <option value="GH">🇬🇭 Ghana</option>
                                        <option value="CM">🇨🇲 Cameroun</option>
                                        <option value="OTHER">🌍 Autre pays</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Ville de résidence (pour la carte) <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.residenceCity} onChange={e => setFormData({ ...formData, residenceCity: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all placeholder:text-gray-400" placeholder="Ex: Abidjan, Paris, Lyon..." required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Complément d&apos;adresse <span className="text-red-500">*</span></label>
                                    <textarea value={formData.adresseResidence} onChange={e => setFormData({ ...formData, adresseResidence: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all resize-none" placeholder="Quartier, Précisions..." required></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Numéro de téléphone 1</label>
                                        <input type="text" value={formData.phone1} onChange={e => setFormData({ ...formData, phone1: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="+225..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Numéro de téléphone 2 (optionnel)</label>
                                        <input type="text" value={formData.phone2} onChange={e => setFormData({ ...formData, phone2: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="+225..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Numéro WhatsApp 1</label>
                                        <input type="text" value={formData.whatsapp1} onChange={e => setFormData({ ...formData, whatsapp1: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="+225..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Numéro WhatsApp 2 (optionnel)</label>
                                        <input type="text" value={formData.whatsapp2} onChange={e => setFormData({ ...formData, whatsapp2: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 outline-none transition-all" placeholder="+225..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gestion des enfants détaillés */}
                        <div>
                            <div className="flex justify-between items-center border-b pb-2 mb-4">
                                <h3 className="text-sm font-bold text-[#FF6600]">5. Détails des Enfants</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newChild = { id: crypto.randomUUID(), firstName: '', lastName: formData.lastName, birthDate: '', gender: '' };
                                        const children = [...(formData.detailsEnfants || []), newChild];
                                        setFormData({ ...formData, detailsEnfants: children, nombreEnfants: children.length });
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#FF6600] px-3 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
                                >
                                    + Ajouter un enfant
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(formData.detailsEnfants || []).length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
                                        <p className="text-xs text-gray-600">Aucun détail d&apos;enfant enregistré.</p>
                                    </div>
                                ) : (
                                    formData.detailsEnfants?.map((child, index) => (
                                        <div key={child.id} className="p-4 bg-gray-50 border border-gray-100 rounded-3xl relative animate-in slide-in-from-top-2 duration-300">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const children = (formData.detailsEnfants || []).filter(c => c.id !== child.id);
                                                    setFormData({ ...formData, detailsEnfants: children, nombreEnfants: children.length });
                                                }}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Prénoms</label>
                                                    <input
                                                        type="text"
                                                        value={child.firstName}
                                                        onChange={e => {
                                                            const children = [...(formData.detailsEnfants || [])];
                                                            children[index].firstName = e.target.value;
                                                            setFormData({ ...formData, detailsEnfants: children });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#FF6600] outline-none"
                                                        placeholder="Prénoms de l'enfant"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Nom</label>
                                                    <input
                                                        type="text"
                                                        value={child.lastName}
                                                        onChange={e => {
                                                            const children = [...(formData.detailsEnfants || [])];
                                                            children[index].lastName = e.target.value;
                                                            setFormData({ ...formData, detailsEnfants: children });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#FF6600] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Date de naissance</label>
                                                    <input
                                                        type="date"
                                                        value={child.birthDate}
                                                        onChange={e => {
                                                            const children = [...(formData.detailsEnfants || [])];
                                                            children[index].birthDate = e.target.value;
                                                            setFormData({ ...formData, detailsEnfants: children });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#FF6600] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Sexe</label>
                                                    <select
                                                        value={child.gender}
                                                        onChange={e => {
                                                            const children = [...(formData.detailsEnfants || [])];
                                                            children[index].gender = e.target.value;
                                                            setFormData({ ...formData, detailsEnfants: children });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#FF6600] outline-none bg-white"
                                                    >
                                                        <option value="">Sélectionner</option>
                                                        <option value="Garçon">Garçon</option>
                                                        <option value="Fille">Fille</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 flex flex-wrap gap-4 mt-1">
                                                    <label className="flex items-center gap-2 cursor-pointer py-1 px-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={child.isDeceased}
                                                            onChange={e => {
                                                                const children = [...(formData.detailsEnfants || [])];
                                                                children[index].isDeceased = e.target.checked;
                                                                if (!e.target.checked) children[index].isVictime2010 = false;
                                                                setFormData({ ...formData, detailsEnfants: children });
                                                            }}
                                                            className="w-4 h-4 accent-[#FF6600] rounded"
                                                        />
                                                        <span className="text-xs font-bold text-gray-600 uppercase">Mention "décédé(e)"</span>
                                                    </label>

                                                    {child.isDeceased && (
                                                        <label className="flex items-center gap-2 cursor-pointer py-1 px-1 animate-in fade-in zoom-in duration-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={child.isVictime2010}
                                                                onChange={e => {
                                                                    const children = [...(formData.detailsEnfants || [])];
                                                                    children[index].isVictime2010 = e.target.checked;
                                                                    setFormData({ ...formData, detailsEnfants: children });
                                                                }}
                                                                className="w-4 h-4 accent-red-600 rounded"
                                                            />
                                                            <span className="text-xs font-bold text-red-600 uppercase">Victime crise 2010</span>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
