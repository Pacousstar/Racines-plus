"use client";

import React, { useState } from 'react';
import { UploadCloud, FileText, FileImage, Trash2, ShieldCheck, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface DocumentManagerProps {
    userId: string;
}

export default function DocumentManager({ userId }: DocumentManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Fonction fictive en attendant la vraie logique Supabase Storage
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        setUploadError(null);

        const file = e.target.files[0];
        // TODO: Implémenter upload vers Supabase bucket "archives" ici

        setTimeout(() => {
            setIsUploading(false);
            setUploadError("Le bucket Supabase 'archives' n'est pas encore créé."); // Simulation d'erreur
        }, 1500);
    };

    return (
        <section className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FF6600]/10 text-[#FF6600] rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Archives Officielles</h2>
                        <p className="text-sm text-gray-600 font-medium">Actes, Preuves Identitaires, Baptêmes</p>
                    </div>
                </div>
                <div className="px-3 py-1.5 bg-[#124E35]/10 text-[#124E35] rounded-full flex items-center gap-1.5 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Coffre Privé Privilégié
                </div>
            </div>

            <div className="p-6">
                {/* Zone d'Upload */}
                <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading ? 'bg-orange-50 border-orange-200 opacity-70' : 'border-gray-300 bg-gray-50 hover:bg-orange-50 hover:border-[#FF6600]/50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                            <div className="w-10 h-10 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mb-3" />
                        ) : (
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                        )}
                        <p className="mb-2 text-sm text-gray-700 font-bold">
                            {isUploading ? "Sécurisation en cours..." : "Cliquez ou glissez un fichier ici"}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">PDF, PNG, JPG (Max 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} disabled={isUploading} />
                </label>

                {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                        <X className="w-4 h-4" /> {uploadError}
                    </div>
                )}

                {/* Liste des Documents Provisoire */}
                <div className="mt-8 space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Vos Documents (0)</h3>
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-gray-500 font-medium text-sm">Votre coffre aux archives est actuellement vide.</p>
                        <p className="text-gray-400 text-xs mt-1">Les documents téléversés ici ne seront visibles que par vous, l'Admin et votre CHO.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
