"use client";

import React from 'react';
import { X, FileText, Image as ImageIcon, ExternalLink, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ProofViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        first_name: string;
        last_name: string;
        metadata?: {
            proof_text?: string;
            proof_url?: string;
        };
    };
    onApprove: () => void;
    onReject: () => void;
    isProcessing: boolean;
    role?: string;
}

export default function ProofViewerModal({ isOpen, onClose, profile, onApprove, onReject, isProcessing, role }: ProofViewerModalProps) {
    if (!isOpen) return null;

    const hasImage = profile.metadata?.proof_url && (profile.metadata.proof_url.match(/\.(jpeg|jpg|gif|png)$/i));
    const isAdmin = role === 'admin' || role === 'cho';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/50 animate-in zoom-in slide-in-from-bottom-8 duration-500">
                
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-[2.5rem]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#FF6600]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Examen du Recours</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{profile.first_name} {profile.last_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-gray-100 text-gray-400 transition-all active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Message de justification */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                            Justification de l&apos;utilisateur
                        </div>
                        <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50 text-gray-800 leading-relaxed font-medium italic italic-font italic-serif">
                            &ldquo;{profile.metadata?.proof_text || "Aucune justification textuelle fournie."}&rdquo;
                        </div>
                    </div>

                    {/* Pièce jointe */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                            Document de preuve
                        </div>
                        
                        {profile.metadata?.proof_url ? (
                            <div className="group relative rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-xl bg-gray-100 aspect-video flex items-center justify-center">
                                {hasImage ? (
                                    <img 
                                        src={profile.metadata.proof_url} 
                                        alt="Preuve" 
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
                                    />
                                ) : (
                                    <div className="text-center p-8">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-500 italic">Document non-image (PDF ou autre)</p>
                                    </div>
                                )}
                                <a 
                                    href={profile.metadata.proof_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black hover:text-white transition-all scale-0 group-hover:scale-100 origin-bottom-right"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Ouvrir en plein écran
                                </a>
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-[2rem] text-center text-gray-400">
                                Aucun document joint à ce recours.
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-8 bg-gray-50 rounded-b-[2.5rem] flex flex-col sm:flex-row gap-4">
                    {isAdmin ? (
                        <button
                            onClick={onReject}
                            disabled={isProcessing}
                            className="flex-1 py-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-100"
                            title="Le rejet sera définitif"
                        >
                            <XCircle className="w-4 h-4" /> Maintenir le rejet
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            Fermer
                        </button>
                    )}
                    <button
                        onClick={onApprove}
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-[#124E35] text-white hover:bg-[#000] rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-900/10"
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {isAdmin ? "Certifier le Citoyen" : "Approuver le recours"}
                    </button>
                </div>
            </div>
        </div>
    );
}
