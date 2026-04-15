"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Database, Search, Mic, MapPin } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                <Link href="/" className="inline-flex items-center text-[#FF6600] font-bold text-sm mb-8 hover:underline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Politique de Confidentialité & RGPD</h1>
                        <p className="text-gray-500 mt-1">Souveraineté et sécurité des données généalogiques africaines.</p>
                    </div>
                </div>

                <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-8">
                    <section>
                        <p className="text-lg font-medium text-gray-900">
                            Chez Racines+, la protection de votre patrimoine généalogique est notre priorité absolue. Nous nous alignons sur les standards internationaux de sécurité des données, incluant le Règlement Général sur la Protection des Données (RGPD), tout en garantissant la souveraineté numérique des mémoires africaines.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <Database className="w-5 h-5 text-blue-600" /> 1. Quelles données collectons-nous ?
                        </h2>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Données d'identité (Déclaratives) :</strong> Noms, prénoms, dates de naissance, sexe, niveau d'études, profession, téléphones.</li>
                            <li><strong>Données patrimoniales :</strong> Origine géographique, village tutélaire (ex: Toa-Zéo), quartiers, et liens de filiation revendiqués.</li>
                            <li><strong>Médias sensibles (<Mic className="inline w-3 h-3"/> / 📷) :</strong> Photos de profil, enregistrements vocaux, certificats, documents cadastraux ou archives soumises pour appuyer un profil.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <Search className="w-5 h-5 text-blue-600" /> 2. Utilisation de l'Intelligence Artificielle (Outils Tiers)
                        </h2>
                        <p className="mt-4">
                            Racines+ utilise des modèles d'Intelligence Artificielle de pointe (comme OpenAI Whisper et DeepSeek) exclusivement pour <strong>transcrire la transmission orale</strong> en textes et analyser les logiques généalogiques.
                            <br/><br/>
                            <strong>Engagement strict :</strong> Vos données audio ou textuelles partagées via notre outil de dictaphone avec ces APIs sont traitées de manière éphémère. Racines+ ne permet pas à ces opérateurs tiers d'utiliser vos histoires familiales pour entraîner leurs modèles publics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <MapPin className="w-5 h-5 text-blue-600" /> 3. Souveraineté, Hébergement et Destinataires
                        </h2>
                        <p className="mt-4">
                            Vos données sont hébergées dans un socle cloud ultra-sécurisé (Supabase/AWS) avec un chiffrement au repos. Contrairement aux réseaux sociaux publics, votre profil, l'arbre de votre village et les registres familiaux ne sont visibles **que par vous-même, les ambassadeurs administratifs et le Chef de l'Héritage (CHO)** de votre village. 
                            Vos informations ne sont jamais revendues à des courtiers en données ou des annonceurs.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                            <Lock className="w-5 h-5 text-blue-600" /> 4. Vos Droits (Oubli, Accès, Rectification)
                        </h2>
                        <p className="mt-4">
                            En vertu de la loi et des standards RGPD, vous disposez d'un contrôle total sur vos données numériques. Vous pouvez à tout moment :
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li><strong>Droit d'accès et d'export :</strong> Télécharger le Livre de Famille généré par la plateforme.</li>
                            <li><strong>Droit de rectification :</strong> Corriger vos informations via votre tableau de bord personnel.</li>
                            <li><strong>Droit à l'effacement :</strong> Demander la suppression intégrale et définitive de votre compte (Attention : la validation par le CHO assure que la généalogie historique fondamentale approuvée par la communauté, telle que l'existence d'un membre à un point de l'arbre, puisse éventuellement être conservée de manière anonymisée).</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-12 bg-blue-50 p-6 rounded-2xl text-center border border-blue-100">
                    <p className="text-sm font-semibold text-gray-700">Pour exercer vos droits ou signaler un problème de confidentialité :</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">rgpd@racinesplus.ci</p>
                </div>
            </div>
        </div>
    );
}
