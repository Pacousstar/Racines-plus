import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CharteConfidentialite() {
    return (
        <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Fond décoratif */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6600]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-racines-green/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-[#FF6600] font-bold hover:underline mb-8">
                    <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                        <div className="w-16 h-16 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-8 h-8 text-[#FF6600]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Charte de Confidentialité</h1>
                            <p className="text-gray-500 mt-1">Souveraineté des données et respect de la vie privée sur Racines+</p>
                        </div>
                    </div>

                    <div className="prose prose-orange max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-[#FF6600]">
                        <p><em>PROJET DE CHARTE - À SOUMETTRE POUR VALIDATION</em></p>

                        <h2>1. Introduction</h2>
                        <p>
                            Bienvenue sur <strong>Racines+</strong>. La protection de vos données personnelles et généalogiques est au cœur de notre engagement.
                            Cette charte a pour but de vous informer de manière transparente sur la manière dont nous collectons, utilisons, stockons et protégeons vos informations.
                        </p>

                        <h2>2. Souveraineté et Hébergement</h2>
                        <p>
                            Racines+ s'engage pour la <strong>souveraineté numérique africaine</strong>. Vos données généalogiques (noms, liens de parenté, photos)
                            sont stockées de manière chiffrée. Nous mettons tout en œuvre pour que ces données restent votre propriété exclusive et celle de vos communautés.
                        </p>

                        <h2>3. Données collectées</h2>
                        <p>Lors de votre inscription et de votre utilisation de Racines+, nous collectons les données suivantes :</p>
                        <ul>
                            <li><strong>Données d'identité :</strong> Prénoms, nom, date de naissance, genre, photo de profil.</li>
                            <li><strong>Données d'origine :</strong> Village d'origine, quartier, pays de résidence.</li>
                            <li><strong>Données généalogiques :</strong> Identité des parents, statuts (vivant/décédé, victime de crise), liens avec les ancêtres.</li>
                            <li><strong>Données de sécurité :</strong> Adresse e-mail, mots de passe (hachés et sécurisés).</li>
                        </ul>

                        <h2>4. Utilisation de vos données</h2>
                        <p>Vos données sont utilisées exclusivement pour :</p>
                        <ul>
                            <li>Reconstituer et afficher votre arbre généalogique personnel et villageois.</li>
                            <li>Permettre au moteur d'intelligence artificielle de détecter les correspondances familiales et les doublons (sans intervention humaine).</li>
                            <li>Garantir la sécurité de votre compte grâce aux processus de validation par les Chief Heritage Officers (CHO et CHOa).</li>
                        </ul>
                        <p><strong>Nous ne revendrons jamais vos données à des tiers ou à des fins publicitaires.</strong></p>

                        <h2>5. Rôle de l'IA et Confidentialité</h2>
                        <p>
                            L'Intelligence Artificielle de Racines+ analyse les parentés pour suggérer des fusions d'arbres.
                            Cette analyse se fait de manière algorithmique et anonymisée dans son traitement de fond, garantissant que vos secrets de famille restent protégés par le système de droits stricts de la plateforme.
                        </p>

                        <h2>6. Accès et Contrôle (Validation CHO)</h2>
                        <p>
                            La véracité et la sécurité de l'arbre dépendent d'un système de double validation. Le <strong>CHOa (Adjoint)</strong> et le <strong>CHO (Chief Heritage Officer)</strong>
                            de votre village ont un accès limité en lecture pour valider votre identité. Une fois votre profil <em>certifié</em>, il est verrouillé et protégé contre les modifications abusives.
                        </p>

                        <h2>7. Vos droits (RGPD et équivalents)</h2>
                        <p>
                            Conformément aux réglementations de protection des données, vous disposez d'un droit de :
                            <strong> consultation, modification, et suppression</strong> de votre compte. Cependant, la suppression d'un "Nœud Fondateur" validé dans l'arbre principal
                            pourra nécessiter l'approbation du CHO du village afin de préserver l'intégrité de la généalogie communautaire.
                        </p>

                        <h2>8. Contact</h2>
                        <p>
                            Pour toute question concernant cette charte ou l'exercice de vos droits, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l'adresse : <a href="mailto:pacous2000@gmail.com">pacous2000@gmail.com</a>.
                        </p>
                    </div>

                    <div className="mt-12 bg-orange-50 rounded-2xl p-6 border border-orange-100 text-center">
                        <p className="text-sm font-bold text-orange-800">
                            En cochant la case d'acceptation lors de votre inscription, vous validez l'intégralité de cette charte.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
