"use client";

import React from 'react';
import { ShieldCheck, Printer, Award, XCircle } from 'lucide-react';

interface CertificateProps {
    userData: {
        id: string;
        first_name: string;
        last_name: string;
        village_origin: string;
        status: string;
        created_at: string;
        certificate_issued_at?: string;
    };
    onClose: () => void;
}

const CertificateView: React.FC<CertificateProps> = ({ userData, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100 print:hidden">
                    <h3 className="font-bold flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" /> Certificat d'Appartenance
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50"
                        >
                            <Printer className="w-4 h-4" /> Imprimer
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <XCircle className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Certificate Body (Printable) */}
                <div className="p-8 md:p-12 print:p-0" id="certificate-print">
                    <div className="border-[12px] border-double border-[#FF6600]/20 p-8 md:p-12 relative overflow-hidden bg-white">
                        {/* Background Emblem */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                            <ShieldCheck className="w-[400px] h-[400px]" />
                        </div>

                        <div className="text-center relative z-10">
                            <div className="flex justify-center mb-6">
                                <img src="/LOGO_Racines.png" alt="Racines+" className="h-16 object-contain" />
                            </div>

                            <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 mb-2 uppercase tracking-tighter">
                                Certificat d&apos;Appartenance
                            </h1>
                            <p className="text-sm font-medium text-[#FF6600] tracking-widest uppercase mb-10">
                                — Registre Patrimonial des Racines —
                            </p>

                            <p className="text-lg italic text-gray-600 mb-2">Il est certifié par la présente que</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
                                {userData.first_name} {userData.last_name}
                            </h2>

                            <p className="text-lg text-gray-600 mb-8 px-10">
                                Est reconnu(e) comme membre légitime de la communauté de <br />
                                <strong className="text-2xl text-gray-900 block mt-2 font-serif">{userData.village_origin}</strong>
                            </p>

                            <div className="flex justify-center gap-16 mb-12">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-tighter">Sceau d'Authenticité numérique</p>
                                    <div className="w-28 h-28 rounded-full border-4 border-double border-[#FF6600]/40 flex items-center justify-center relative rotate-12">
                                        <div className="w-24 h-24 rounded-full bg-[#FF6600]/5 flex flex-col items-center justify-center border border-[#FF6600]/30 scale-90">
                                            <ShieldCheck className="w-8 h-8 text-[#FF6600] mb-1" />
                                            <span className="text-[8px] font-black text-[#FF6600] leading-none text-center">RACINES+<br />OFFICIEL</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center pt-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-tighter">Signature du CHO</p>
                                    <div className="w-48 h-24 border-b-2 border-gray-200 flex flex-col items-center justify-end pb-3">
                                        <span className="font-serif italic text-gray-900 text-lg mb-1 leading-none">DIHI T. Dénis</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Chef de Patrimoine</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                                    Délivré par l'Administration Racines+
                                </span>
                            </div>

                            <p className="text-[9px] text-gray-400 font-medium">
                                Certificat numérique sécurisé • ID: {userData.id.substring(0, 8).toUpperCase()} <br />
                                Date de délivrance : {userData.certificate_issued_at ? new Date(userData.certificate_issued_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #certificate-print, #certificate-print * {
                        visibility: visible;
                    }
                    #certificate-print {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default CertificateView;
