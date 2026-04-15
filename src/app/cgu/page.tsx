"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Shield, Users, BookOpen } from 'lucide-react';

export default function CGUPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                <Link href="/" className="inline-flex items-center text-[#FF6600] font-bold text-sm mb-8 hover:underline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-[#FF6600]">
                        <Scale className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Conditions Générales d'Utilisation</h1>
                        <p className="text-gray-500 mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="prose prose-orange max-w-none text-gray-700 leading-relaxed space-y-8">
                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <BookOpen className="w-5 h-5 text-[#FF6600]" /> 1. Objet et Présentation
                        </h2>
                        <p className="mt-4">
                            Bienvenue sur <strong>Racines+</strong>. Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions de navigation et d'utilisation des services généalogiques et archivistiques fournis par Racines+. En créant un profil et en naviguant sur la plateforme, l'Utilisateur accepte pleinement et sans réserve les présentes CGU.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <Users className="w-5 h-5 text-[#FF6600]" /> 2. Rôles et Autorité Communautaire
                        </h2>
                        <p className="mt-4">
                            Racines+ fonctionne sur un modèle de gouvernance collaboratif et hiérarchisé afin de préserver l'exactitude historique :
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li><strong>Utilisateur Membre :</strong> Peut créer son profil, ajouter ses descendants directs et soumettre des documents à titre informatif.</li>
                            <li><strong>CHO (Chief Heritage Officer) :</strong> L'autorité suprême de la lignée ou du village (ex: le Patriarche de Toa-Zéo). Lui seul possède le droit de certifier le statut "Ancêtre Fondateur" et de valider de manière immuable l'arbre pyramidal sur la base souveraine de Racines+.</li>
                            <li><strong>Ambassadeurs (CHOa) :</strong> Représentants assermentés qui modèrent les entrées et aident les utilisateurs dans la numérisation de la mémoire.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <Shield className="w-5 h-5 text-[#FF6600]" /> 3. Code de Conduite et Exactitude
                        </h2>
                        <p className="mt-4">
                            L'Utilisateur s'engage à fournir des informations véridiques, exactes et documentées lors de son processus d'Onboarding. Il est strictement interdit d'insérer des données diffamatoires, des généalogies intentionnellement falsifiées ou de s'approprier frauduleusement un lignage.
                            Tout litige sur une filiation sera arbitré par le CHO local de manière souveraine, hors des systèmes automatisés.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <BookOpen className="w-5 h-5 text-[#FF6600]" /> 4. Propriété Intellectuelle
                        </h2>
                        <p className="mt-4">
                            L'infrastructure technologique, la marque, l'arbre pyramidal interactif et les analyses produites par l'Intelligence Artificielle de Racines+ sont la propriété intellectuelle exclusive de Racines+. 
                            Cependant, <strong>vos mémoires, audios et documents familiaux vous appartiennent</strong>. Vous nous accordez une licence stricte d'hébergement pour permettre la transcription et l'affichage privé de votre arbre au sein du cercle défini par votre village.
                        </p>
                    </section>
                </div>

                <div className="mt-12 bg-gray-50 p-6 rounded-2xl text-center border">
                    <p className="text-sm font-semibold text-gray-600">Pour toute question sur ces conditions, contactez notre équipe légale à :</p>
                    <p className="text-lg font-bold text-[#FF6600] mt-1">legal@racinesplus.ci</p>
                </div>
            </div>
        </div>
    );
}
