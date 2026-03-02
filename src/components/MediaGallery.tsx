"use client";

import React, { useState } from 'react';
import { Image as ImageIcon, Play, UploadCloud, X, Camera, Calendar, Tag, ShieldCheck } from 'lucide-react';

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    title: string;
    date?: string;
    tags: string[];
}

// Données fictives simulant le contenu qui viendra de Supabase
const PREVIEW_MEDIA: MediaItem[] = [
    { id: '1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', type: 'image', title: 'Grand-père à Abidjan', date: '1975', tags: ['Ancêtre', 'Abidjan'] },
    { id: '2', url: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5af?w=800&q=80', type: 'image', title: 'Mariage de Tante', date: '1998', tags: ['Mariage', 'Fête'] },
    { id: '3', url: 'https://images.unsplash.com/photo-1606206105828-b0a7c49bb887?w=800&q=80', type: 'image', title: 'Réunion de Famille (Toa-Zéo)', date: '2015', tags: ['Village', 'Toa-Zéo'] },
];

export default function MediaGallery() {
    const [media, setMedia] = useState<MediaItem[]>(PREVIEW_MEDIA);
    const [isUploading, setIsUploading] = useState(false);

    // Simulation d'upload
    const handleUploadClick = () => {
        setIsUploading(true);
        setTimeout(() => setIsUploading(false), 800);
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
                {/* Filtres simples (UI Uniquement pour l'instant) */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full">Tous</button>
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Photos</button>
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Vidéos</button>
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Par Année</button>
                </div>

                {/* Grille Photo Masonry-style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
                    {media.map((item) => (
                        <div key={item.id} className="relative group rounded-2xl overflow-hidden cursor-pointer bg-gray-100">
                            {/* Note sur le SEO / Perf : loading="lazy" pour ne charger que ce qu'on voit */}
                            <img
                                src={item.url}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Overlay Gradient au Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <h4 className="text-white font-black text-sm mb-1">{item.title}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-xs font-medium flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {item.date || 'Inconnu'}
                                    </span>
                                    <div className="flex gap-1">
                                        {item.tags.slice(0, 2).map((tag, idx) => (
                                            <span key={idx} className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Icône Vidéo s'il y a lieu */}
                            {item.type === 'video' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                    <Play className="w-5 h-5 ml-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {media.length === 0 && (
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
