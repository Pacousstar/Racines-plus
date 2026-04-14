import React from 'react';
import { TreePine, ScrollText, Award, MapPin, Calendar, Camera, Crown, Shield, Flower2, Quote, History, BookOpen } from 'lucide-react';

interface FamilyBookProps {
    profile: any;
    familyNodes: any[]; // Ce sont les parents, fratrie, etc.
    archives: any[];
    format?: 'portrait' | 'landscape';
}

export default function FamilyBook({ profile, familyNodes, archives, format = 'portrait' }: FamilyBookProps) {
    const isLandscape = format === 'landscape';
    const parents = familyNodes.filter(n => n.type === 'parent' || n.lien === 'Père' || n.lien === 'Mère');
    const children = familyNodes.filter(n => n.type === 'child');
    
    // Motifs Adinkra (SVG Simple)
    const AdinkraGyeNyame = () => (
        <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-10 fill-current">
            <path d="M20 0c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 36c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z"/>
            <path d="M20 8c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
        </svg>
    );

    return (
        <div id="family-book-content" className={`bg-[#FDFBF7] text-[#2c241a] shadow-2xl p-0 font-serif overflow-hidden mx-auto border-[1px] border-amber-200 ${isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}>
            
            {/* PAGE 1: COUVERTURE ROYALE */}
            <div className={`${isLandscape ? 'h-[210mm]' : 'h-[297mm]'} flex flex-col items-center justify-between p-20 border-[20px] border-double border-[#1c3a2f] relative page-break-after`}>
                {/* Coins ornementaux */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-500/40" />
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-500/40" />
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-500/40" />
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-500/40" />
                
                <div className="flex flex-col items-center gap-8 mt-12 scale-110">
                    <div className="w-32 h-32 bg-[#1c3a2f] rounded-[2.5rem] flex items-center justify-center p-6 shadow-2xl rotate-3">
                        <img src="/LOGO_Racines.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-amber-600 text-sm tracking-[0.5em] font-black uppercase mb-2">Mémoire de Ligné</h2>
                        <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                    </div>
                </div>

                <div className="text-center flex flex-col gap-6">
                    <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em]">Chroniques de Famille</p>
                    <h1 className="text-7xl font-black text-[#1c3a2f] leading-tight mb-4 tracking-tighter">
                        LIVRE DE <br />
                        <span className="text-amber-700 italic font-serif font-light underline decoration-amber-200/50 underline-offset-8 decoration-4">{profile.lastName.toUpperCase()}</span>
                    </h1>
                    <div className="w-32 h-1 bg-amber-500/30 mx-auto my-6" />
                    <p className="text-2xl tracking-widest uppercase font-sans text-stone-500 font-light">Lignée de {profile.firstName}</p>
                </div>

                <div className="mb-8 text-center font-sans space-y-4">
                    <div className="flex items-center justify-center gap-4 text-amber-800">
                        <AdinkraGyeNyame />
                        <div className="text-center">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Village Ancestral</p>
                            <p className="text-xl font-black text-[#1c3a2f] tracking-tight">{profile.village || 'Toa-Zéo'}</p>
                        </div>
                        <AdinkraGyeNyame />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-12 font-bold uppercase tracking-widest">Édition Patrimoniale • {new Date().getFullYear()}</p>
                </div>
            </div>

            {/* PAGE 2: RÉCIT DE LIGNÉE & ORIGINES */}
            <div className={`${isLandscape ? 'min-h-[210mm]' : 'min-h-[297mm]'} p-24 border-l-[60px] border-[#1c3a2f] bg-white relative page-break-after`}>
                <div className="absolute top-10 right-10">
                    <History className="w-12 h-12 text-stone-100" />
                </div>

                <header className="mb-20">
                    <h2 className="text-5xl font-black text-[#1c3a2f] flex items-center gap-6 leading-none">
                         Héritage & <br /> Fondations
                    </h2>
                    <div className="w-20 h-2 bg-amber-500 mt-6" />
                </header>
                
                <div className="grid grid-cols-1 gap-16">
                    <section className="space-y-8">
                        <div className="relative">
                            <Quote className="absolute -top-6 -left-8 w-16 h-16 text-stone-100 -z-10" />
                            <p className="text-xl leading-relaxed text-stone-800 first-letter:text-7xl first-letter:font-black first-letter:text-[#1c3a2f] first-letter:mr-4 first-letter:float-left first-letter:leading-[0.8]">
                                La lignée {profile.lastName} s&apos;enracine dans les terres sacrées de {profile.village}. 
                                À travers les décennies, nous avons préservé non seulement nos noms, mais aussi les valeurs qui font la grandeur de notre peuple. 
                                Ce livre est le témoin de notre passage et le phare pour ceux qui nous suivront.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#1c3a2f] mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-amber-600" /> Ancrage Territorial
                                </h4>
                                <p className="text-base text-stone-600 font-medium">Quartier {profile.quartier || 'Non spécifié'}</p>
                                <p className="text-xs text-stone-400 mt-2 italic">Certifié par le Conseil des Chefs</p>
                            </div>
                            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                                <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-200/50 group-hover:scale-110 transition-transform" />
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-amber-900 mb-4 flex items-center gap-2">
                                    <Crown className="w-4 h-4" /> Statut Actuel
                                </h4>
                                <p className="text-base text-amber-800 font-black tracking-tight uppercase">Maison {profile.lastName}</p>
                                <p className="text-xs text-amber-600/80 font-bold mt-2">Lignée Validée Racines+</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* NOUVELLE SECTION: CHRONIQUES DE GRANDEUR */}
                <div className="mt-24">
                    <h3 className="text-2xl font-black text-[#1c3a2f] mb-12 flex items-center gap-4 uppercase tracking-widest">
                        <ScrollText className="w-6 h-6 text-amber-500" /> Chroniques de Vie
                    </h3>
                    <div className="space-y-12">
                        {parents.map((node, i) => (
                            <div key={i} className="flex gap-8 items-start relative group">
                                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white border-4 border-white shadow-xl ${node.side === 'paternal' ? 'bg-blue-600' : 'bg-[#C05C3C]'}`}>
                                    {node.side === 'paternal' ? <Shield className="w-8 h-8" /> : <Flower2 className="w-8 h-8" />}
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-black text-xl text-stone-900 tracking-tight">{node.nom}</h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${node.side === 'paternal' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                            Branche {node.side === 'paternal' ? 'Paternelle' : 'Maternelle'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-500 mt-2 leading-relaxed italic max-w-lg">
                                        {node.lien} de la génération précédente. Représente le pilier industriel et spirituel de la branche {node.side === 'paternal' ? 'fondée sur la protection' : 'portée par la sagesse'}.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAGE 3: L'ARBRE ADN GÉOGRAPHIQUE */}
            <div className={`${isLandscape ? 'min-h-[210mm]' : 'min-h-[297mm]'} p-24 bg-[#1c3a2f] text-white flex flex-col items-center justify-between page-break-after relative overflow-hidden`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <header className="text-center relative z-10">
                    <TreePine className="w-16 h-16 text-amber-400 mb-6 mx-auto" />
                    <h2 className="text-5xl font-black mb-2 tracking-tighter">L&apos;Arbre des Racines</h2>
                    <p className="text-amber-400 text-sm opacity-90 uppercase tracking-[0.4em] font-medium">Cartographie de l&apos;Héritage</p>
                </header>
                
                <div className="w-full max-w-3xl bg-white/5 backdrop-blur-2xl rounded-[3rem] p-16 border border-white/10 relative shadow-2xl">
                    <div className="flex flex-col gap-16 relative z-10">
                        {/* L'Ancêtre */}
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-2xl rotate-3">
                                <Crown className="w-10 h-10" />
                            </div>
                            <div className="mt-4 px-6 py-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400 text-[10px] font-black uppercase">Ancêtre Fondateur</div>
                            <div className="w-[2px] h-12 bg-gradient-to-b from-amber-500 to-transparent my-2" />
                        </div>

                        {/* Les Parents avec Codes Couleurs */}
                        <div className="flex justify-center gap-24 relative">
                            {parents.map((p, i) => (
                                <div key={i} className="flex flex-col items-center relative">
                                    <div className={`w-28 h-28 rounded-3xl border-4 border-[#1c3a2f] shadow-2xl flex items-center justify-center overflow-hidden ${p.side === 'paternal' ? 'bg-blue-600' : 'bg-[#C05C3C]'}`}>
                                        {p.avatar_url ? <img src={p.avatar_url} alt="Photo" className="w-full h-full object-cover" /> : (
                                            p.side === 'paternal' ? <Shield className="w-12 h-12 text-white/40" /> : <Flower2 className="w-12 h-12 text-white/40" />
                                        )}
                                    </div>
                                    <h4 className="mt-4 font-black text-sm tracking-tight text-center">{p.nom}</h4>
                                    <p className={`text-[9px] font-black uppercase mt-1 ${p.side === 'paternal' ? 'text-blue-300' : 'text-red-300'}`}>Branche {p.side}</p>
                                </div>
                            ))}
                            {/* Ligne de connexion */}
                            <div className="absolute top-1/2 left-[30%] right-[30%] h-[2px] bg-white/10 -z-10" />
                        </div>

                        {/* VOUS */}
                        <div className="flex flex-col items-center">
                             <div className="w-[2px] h-12 bg-gradient-to-t from-[#FF6600] to-transparent my-2" />
                             <div className="px-10 py-6 bg-white text-[#1c3a2f] font-black text-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(255,102,0,0.3)] border-4 border-[#FF6600] scale-110">
                                {profile.firstName} {profile.lastName}
                             </div>
                             <div className="mt-4 px-5 py-2 bg-[#FF6600]/10 border border-[#FF6600]/40 rounded-xl text-[#FF6600] text-[10px] font-black uppercase tracking-widest">Source de la Descendance</div>
                        </div>

                        {/* Les Enfants */}
                        <div className="flex justify-center gap-6 flex-wrap mt-8">
                            {children.slice(0, 4).map((child, i) => (
                                <div key={i} className="bg-white/5 px-6 py-4 rounded-2xl text-center border border-white/10 shadow-lg min-w-[140px]">
                                    <p className="text-[10px] text-amber-400 uppercase font-black tracking-widest mb-1">Enfant</p>
                                    <p className="font-bold text-sm">{child.nom}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pb-8 opacity-40">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em]">Patrimoine Numérique Certifié Racines+</p>
                </div>
            </div>
            
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;900&display=swap');
                
                #family-book-content {
                    font-family: 'EB Garamond', serif;
                }
                
                .font-sans {
                    font-family: 'Outfit', sans-serif;
                }

                @media print {
                    .page-break-after {
                        page-break-after: always;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
