import React, { useState } from 'react';
import { Calendar, MapPin, AlignLeft, Info, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organisateurId: string;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess, organisateurId }: CreateEventModalProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        titre: '',
        type_evenement: 'reunion',
        date_evenement: '',
        lieu: '',
        description: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.from('family_events').insert([{
                ...formData,
                organisateur_id: organisateurId
            }]);

            if (error) throw error;
            onSuccess();
        } catch (error: any) {
            console.error('Erreur création événement:', error);
            alert("Une erreur est survenue lors de la création de l'événement.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-[#FF6600]" />
                        Nouvel Événement
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form id="createEventForm" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Titre de l'événement *</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: Réunion Familiale Annuelle"
                                value={formData.titre}
                                onChange={e => setFormData({ ...formData, titre: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Type *</label>
                                <select
                                    required
                                    value={formData.type_evenement}
                                    onChange={e => setFormData({ ...formData, type_evenement: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none transition-all"
                                >
                                    <option value="reunion">Réunion</option>
                                    <option value="mariage">Mariage</option>
                                    <option value="obseques">Obsèques</option>
                                    <option value="fete_generation">Fête de génération</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Date et heure *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.date_evenement}
                                    onChange={e => setFormData({ ...formData, date_evenement: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Lieu *</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Abidjan, Cocody"
                                    value={formData.lieu}
                                    onChange={e => setFormData({ ...formData, lieu: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Description</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                                <textarea
                                    rows={4}
                                    placeholder="Ajoutez des détails, un ordre du jour..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <p className="flex items-center gap-1.5 text-[10px] text-gray-500 max-w-[200px] leading-tight font-medium">
                        <Info className="w-3 h-3 shrink-0" /> Visible par tout le réseau de la famille élargie.
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            form="createEventForm"
                            disabled={isLoading}
                            className="bg-[#FF6600] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#e55c00] transition-colors shadow-md shadow-[#FF6600]/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Publier l'événement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
