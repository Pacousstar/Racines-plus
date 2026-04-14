"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import FamilyBook from '@/components/FamilyBook';
import { Download, Loader2, ArrowLeft, Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FamilyBookPage({ params }: { params: { userId: string } }) {
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [familyNodes, setFamilyNodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const bookRef = useRef<HTMLDivElement>(null);

    // Simulation de récupération d'ID (dans un vrai cas, on l'aurait dans l'URL ou session)
    // Ici on suppose que le userId est géré par le layout parent ou passé en prop
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        checkUser();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Profil
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, village_origin, quartier_nom')
                    .eq('id', userId)
                    .single();

                // 2. Tree Data (Neo4j via API)
                const res = await fetch('/api/tree');
                const treeData = await res.json();

                // Transformation succincte pour le template
                const nodes = treeData.nodes.map((n: any) => ({
                    nom: `${n.firstName} ${n.lastName}`,
                    status: n.status,
                    generation: n.isFounder ? 0 : 2, // Simplification
                    type: n.isFounder ? 'ancetre' : 'family'
                }));

                setProfile({
                    firstName: prof?.first_name || '',
                    lastName: prof?.last_name || '',
                    village: prof?.village_origin || 'Toa-Zéo',
                    quartier: prof?.quartier_nom || ''
                });
                setFamilyNodes(nodes);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleDownloadPDF = async () => {
        if (!bookRef.current) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(bookRef.current, {
                scale: 2, // Haute définition
                useCORS: true,
                logging: false,
                backgroundColor: '#F9F6EE'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Gestion multi-pages simple (on divise l&apos;image par tranches de 297mm)
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Livre_de_Famille_${profile?.lastName}.pdf`);
        } catch (err) {
            console.error("Export error:", err);
            alert("Une erreur est survenue lors de la génération du PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin mb-4" />
                <h2 className="text-xl font-bold">Préparation de votre Livre de Famille...</h2>
                <p className="text-gray-500">Extraction des données de la lignée en cours.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[#FF6600]" /> Livre de Famille Premium
                            </h1>
                            <p className="text-gray-600 mt-1">Générez un document d&apos;archive de haute qualité pour votre patrimoine.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => window.print()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all"
                        >
                            <Printer className="w-5 h-5" /> Imprimer
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FF6600] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#FF6600]/30 hover:bg-[#e55c00] transition-all disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            {isExporting ? 'Génération...' : 'Télécharger le PDF'}
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr,400px] gap-12 items-start">
                    {/* Preview du Livre */}
                    <div className="flex justify-center bg-gray-200 p-8 rounded-[40px] shadow-inner overflow-x-auto">
                        <div className="scale-[0.5] sm:scale-[0.7] md:scale-100 origin-top">
                            <div ref={bookRef}>
                                <FamilyBook profile={profile} familyNodes={familyNodes} archives={[]} />
                            </div>
                        </div>
                    </div>

                    {/* Paramètres & Aide */}
                    <div className="space-y-6">
                        <div className="bg-[#064E3B] text-white p-8 rounded-[32px] shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#D4AF37]">
                                <Award className="w-6 h-6" /> Note de Certification
                            </h3>
                            <p className="text-sm text-green-100/80 leading-relaxed mb-6">
                                Ce livre de famille regroupe les données certifiées par le Chef de l&apos;Héritage (CHO) de {profile?.village}. C&apos;est un document officiel de votre lignée.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <span className="text-sm font-medium">Format A4 Haute Définition</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <span className="text-sm font-medium">Design Patrimonial Africain</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4">Contenu du document</h4>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 text-[#FF6600] mt-0.5" />
                                    <span>Couverture personnalisée avec vos armoiries</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 text-[#FF6600] mt-0.5" />
                                    <span>Historique du village et du quartier</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 text-[#FF6600] mt-0.5" />
                                    <span>Visualisation de l&apos;arbre de descendance</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
