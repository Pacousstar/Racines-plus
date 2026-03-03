"use client";

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, FileImage, Trash2, ShieldCheck, X, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface DocumentManagerProps {
    userId: string;
}

interface DocItem {
    id: string;
    title: string;
    file_type: string;
    file_url: string;
    created_at: string;
}

export default function DocumentManager({ userId }: DocumentManagerProps) {
    const supabase = createClient();
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('bucket_name', 'archives')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur chargement archives:', error);
        } else if (data) {
            setDocuments(data as DocItem[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (userId) fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Le fichier dépasse 5 Mo.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('archives')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            let fileType = 'image';
            if (file.type === 'application/pdf') fileType = 'pdf';

            const { error: dbError } = await supabase.from('documents').insert({
                user_id: userId,
                title: file.name,
                file_url: filePath,
                file_type: fileType,
                bucket_name: 'archives',
                is_public: false
            });

            if (dbError) throw dbError;

            fetchDocuments();
        } catch (err: any) {
            console.error('Erreur Upload Archive:', err);
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, filePath: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cet acte officiel ?')) return;

        try {
            const { error: storageError } = await supabase.storage.from('archives').remove([filePath]);
            if (storageError) console.warn('Possible erreur de suppression storage:', storageError);

            const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
            if (dbError) throw dbError;

            setDocuments(documents.filter(d => d.id !== id));
        } catch (err: any) {
            console.error('Erreur suppression:', err);
            alert('Erreur: ' + err.message);
        }
    };

    // Création d'un "Signed URL" temporaire pour les documents privés !
    const handleDownload = async (filePath: string, title: string) => {
        try {
            // Lien valable 60 secondes (1 min) pour sécuriser l'accès
            const { data, error } = await supabase.storage.from('archives').createSignedUrl(filePath, 60);
            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (err) {
            console.error("Erreur de téléchargement", err);
            alert("Impossible d'ouvrir le document. Vérifiez vos droits d'accès.");
        }
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
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/jpeg,image/png,image/webp" onChange={handleFileUpload} disabled={isUploading} />
                </label>

                {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                        <X className="w-4 h-4" /> {uploadError}
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Vos Documents ({documents.length})</h3>

                    {isLoading ? (
                        <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin" /></div>
                    ) : documents.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-gray-500 font-medium text-sm">Votre coffre aux archives est actuellement vide.</p>
                            <p className="text-gray-400 text-xs mt-1">Les documents téléversés ici ne seront visibles que par vous, l'Admin et votre CHO.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500">
                                            {doc.file_type === 'pdf' ? <FileText className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1 break-all">{doc.title}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDownload(doc.file_url, doc.title)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Télécharger / Voir">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(doc.id, doc.file_url)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
