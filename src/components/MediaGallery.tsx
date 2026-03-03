"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Play, UploadCloud, Camera, Calendar, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface MediaItem {
    id: string;
    filePath: string;
    url: string;
    type: 'image' | 'video';
    title: string;
    date?: string;
    tags: string[];
    user_id: string;
}

export default function MediaGallery({ userId }: { userId: string }) {
    const supabase = createClient();
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('bucket_name', 'media')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur chargement des médias:', error);
        } else if (data) {
            const formattedMedia: MediaItem[] = data.map(doc => ({
                id: doc.id,
                filePath: doc.file_url,
                url: supabase.storage.from('media').getPublicUrl(doc.file_url).data.publicUrl,
                type: doc.file_type as 'image' | 'video',
                title: doc.title,
                tags: doc.tags || [],
                user_id: doc.user_id,
                date: new Date(doc.created_at).getFullYear().toString()
            }));
            setMedia(formattedMedia);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('Le fichier dépasse la limite de 10 Mo.');
            return;
        }

        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            let fileType = 'image';
            if (file.type.startsWith('video/')) fileType = 'video';

            const { error: dbError } = await supabase.from('documents').insert({
                user_id: userId,
                title: file.name.replace(/\.[^/.]+$/, "").substring(0, 50),
                file_url: filePath,
                file_type: fileType,
                bucket_name: 'media',
                is_public: true
            });

            if (dbError) throw dbError;

            fetchMedia();
        } catch (err: any) {
            console.error('Erreur Upload Media:', err);
            alert('Erreur lors du téléversement: ' + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, filePath: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce souvenir ?')) return;

        try {
            // Delete from Storage
            const { error: storageError } = await supabase.storage.from('media').remove([filePath]);
            if (storageError) console.warn('Possible erreur de suppression storage:', storageError);

            // Delete from Database
            const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
            if (dbError) throw dbError;

            setMedia(media.filter(m => m.id !== id));
        } catch (err: any) {
            console.error('Erreur suppression:', err);
            alert('Erreur: ' + err.message);
        }
    };

    return (
        <section className="bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Galerie Souvenirs</h2>
                        <p className="text-sm text-gray-600 font-medium">Photos et vidéos de la Lignée</p>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/mp4"
                    onChange={handleFileUpload}
                />

                <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6600] hover:bg-[#e65c00] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                    {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Ajouter un souvenir
                </button>
            </div>

            <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full">Tous</button>
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Photos</button>
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Vidéos</button>
                </div>

                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
                        {media.map((item) => (
                            <div key={item.id} className="relative group rounded-2xl overflow-hidden cursor-pointer bg-gray-100">
                                <img
                                    src={item.type === 'video' ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80' : item.url}
                                    alt={item.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h4 className="text-white font-black text-sm mb-1 line-clamp-1">{item.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {item.date}
                                        </span>
                                        {item.user_id === userId && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.filePath); }}
                                                className="bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {item.type === 'video' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-none">
                                        <Play className="w-5 h-5 ml-1" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && media.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">Aucun souvenir n'a encore été ajouté.</p>
                        <p className="text-sm mt-1">Soyez le premier à partager une photo de famille !</p>
                    </div>
                )}
            </div>
        </section>
    );
}
