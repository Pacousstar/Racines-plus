"use client";

import React, { useRef, useState } from 'react';
import { X, Download, Crown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PremiumTreeTemplate, StandardTreeTemplate, LineageData } from './PremiumTreeTemplate';

interface ExportTreeModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: LineageData;
    userRole: string;
}

export default function ExportTreeModal({ isOpen, onClose, data, userRole }: ExportTreeModalProps) {
    const [isExporting, setIsExporting] = useState<'standard' | 'premium' | null>(null);
    const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const premiumRef = useRef<HTMLDivElement>(null);
    const standardRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleExportStandard = async () => {
        if (!standardRef.current) return;
        setIsExporting('standard');
        try {
            const canvas = await html2canvas(standardRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `arbre_standard_${data.self?.nom || 'famille'}.png`;
            link.click();
        } catch (error) {
            console.error('Export Standard failed', error);
        } finally {
            setIsExporting(null);
            onClose();
        }
    };

    const handleExportPremium = async () => {
        if (userRole !== 'admin') {
            alert('La version Premium est en cours de développement.\nCette version est disponible gratuitement en test uniquement pour l\'Administrateur Général.');
            return;
        }

        if (!premiumRef.current) return;
        setIsExporting('premium');
        try {
            const canvas = await html2canvas(premiumRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FDFBF7'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            // Dimensions A4 en pixels (approx 210x297 mm) => format paysage optionnel
            // Ici on va faire un A3 Portrait => 297x420 mm
            const pdf = new jsPDF({
                orientation: exportOrientation,
                unit: 'mm',
                format: 'a3'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Arbre_Premium_${data.ancestre?.nom || 'Famille'}_${new Date().getFullYear()}.pdf`);
        } catch (error) {
            console.error('Export Premium failed', error);
        } finally {
            setIsExporting(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            {/* Conteneurs invisibles pour la capture htm2canvas */}
            <div className="hidden-capture-contain" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <PremiumTreeTemplate ref={premiumRef} data={data} orientation={exportOrientation} />
                <StandardTreeTemplate ref={standardRef} data={data} />
            </div>

            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">

                {/* Section Gauche : Standard */}
                <div className="flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Arbre Standard</h2>
                            <p className="text-sm text-gray-500 mt-1">Export Rapide & Élégant</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-2xl p-6 mb-8 flex items-center justify-center border border-gray-100 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent opacity-50"></div>
                        <ul className="space-y-4 text-sm text-gray-600 relative z-10 w-full">
                            <li className="flex gap-3"><span className="text-[#124E35]">✓</span> Filiation Nucléaire (Parents, Vous, Enfants)</li>
                            <li className="flex gap-3"><span className="text-[#124E35]">✓</span> Format Image (PNG)</li>
                            <li className="flex gap-3"><span className="text-[#124E35]">✓</span> Partage social rapide</li>
                            <li className="flex gap-3 text-gray-400 line-through"><span className="text-gray-300">✗</span> Remontée à l'Ancêtre Fondateur</li>
                        </ul>
                    </div>

                    <div className="mt-auto">
                        <div className="mb-4 text-center">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">100% Gratuit</span>
                        </div>
                        <button
                            onClick={handleExportStandard}
                            disabled={isExporting !== null}
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {isExporting === 'standard' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            Télécharger l'Image
                        </button>
                    </div>
                </div>

                {/* Section Droite : Premium */}
                <div className="flex-1 p-8 sm:p-12 bg-gradient-to-b from-[#FFFDF5] to-white flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/50 hover:bg-white rounded-full transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex justify-between items-start mb-6 pt-4 md:pt-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Crown className="w-6 h-6 text-amber-500" />
                                <h2 className="text-2xl font-black text-[#1c2b23]">Héritage Premium</h2>
                            </div>
                            <p className="text-sm text-amber-700/80">Le parchemin majestueux de votre lignée</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-amber-50/50 rounded-2xl p-6 mb-8 border border-amber-200 shadow-inner relative overflow-hidden">
                        {/* Effet brillance */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400 blur-3xl opacity-20 animate-pulse"></div>

                        <ul className="space-y-4 text-sm text-stone-700 relative z-10 font-medium">
                            <li className="flex gap-3 items-start"><Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" /> Remontée Chronologique Complète (jusqu'à l'Ancêtre Fondateur 👑)</li>
                            <li className="flex gap-3 items-start"><Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" /> Dates de Vie, Statuts (Mémorial 🔥) et Drapeaux de Résidence 🇨🇮</li>
                            <li className="flex gap-3 items-start"><Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" /> Design Parchemin Prestigieux</li>
                            <li className="flex gap-3 items-start"><Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" /> Format PDF Haute Définition (A3/A4) prêt pour l'encadrement en salon.</li>
                        </ul>
                    </div>

                    <div className="mt-8 mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-inner">
                         <p className="text-[10px] font-black uppercase text-amber-700 mb-3 tracking-widest text-center">Choix de l&apos;Orientation</p>
                         <div className="flex gap-4">
                            <button 
                                onClick={() => setExportOrientation('portrait')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${exportOrientation === 'portrait' ? 'border-amber-600 bg-amber-100' : 'border-stone-200 bg-white opacity-60'}`}
                            >
                                <div className="w-5 h-7 border-2 border-current rounded-sm mb-1" />
                                <span className="text-xs font-bold">Livre (Portrait)</span>
                            </button>
                            <button 
                                onClick={() => setExportOrientation('landscape')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${exportOrientation === 'landscape' ? 'border-amber-600 bg-amber-100' : 'border-stone-200 bg-white opacity-60'}`}
                            >
                                <div className="w-7 h-5 border-2 border-current rounded-sm mb-1" />
                                <span className="text-xs font-bold">Album (Paysage)</span>
                            </button>
                         </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">Prochainement</span>
                            </div>
                            {userRole === 'admin' ? (
                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Test Admin Actif
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 flex h-8 items-center px-3 rounded-full">
                                    Bientôt Disponible
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleExportPremium}
                            disabled={isExporting !== null && isExporting !== 'premium'} // On laisse le clic si c'est pas admin, pour afficher l'alerte
                            className="w-full flex items-center justify-between py-4 px-6 bg-gradient-to-r from-amber-600 to-[#124E35] hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-xl shadow-amber-900/20 group"
                        >
                            <span className="flex items-center gap-2">
                                {isExporting === 'premium' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                Générer en {exportOrientation === 'portrait' ? 'Portrait' : 'Paysage'}
                            </span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
