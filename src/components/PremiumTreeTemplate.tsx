"use client";

import React from 'react';
import { Crown } from 'lucide-react';

export interface LineageData {
    ancestre: any;
    parents: any[];
    self: any;
    children: any[];
}

export const PremiumTreeTemplate = React.forwardRef<HTMLDivElement, { data: LineageData, orientation?: 'portrait' | 'landscape' }>(({ data, orientation = 'portrait' }, ref) => {
    const isLandscape = orientation === 'landscape';
    // Rend chaque nœud de manière luxueuse
    const renderNode = (node: any, isAncetre = false) => {
        if (!node) return null;
        const initials = node.nom ? node.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '??';
        const statusIcon = node.status === 'confirmed' ? '✓' : node.status === 'probable' ? '○' : '⏳';

        let period = node.periodeOuNaissance || node.periode || node.birthYear || 'Date inconnue';
        const flag = "🇨🇮";

        const sideColor = node.side === 'paternal' ? 'border-blue-600' : node.side === 'maternal' ? 'border-[#C05C3C]' : isAncetre ? 'border-amber-500' : 'border-[#124E35]';

        return (
            <div className="flex flex-col items-center gap-2 m-4 bg-white/80 p-4 rounded-xl border border-amber-200 shadow-md transform transition-all">
                <div className={`relative w-24 h-24 rounded-full border-4 shadow-xl flex items-center justify-center bg-stone-100 overflow-hidden ${sideColor}`}>
                    {node.avatarUrl ? (
                        <img src={node.avatarUrl} alt={node.nom} className="w-full h-full object-cover" />
                    ) : isAncetre ? (
                        <Crown className="w-12 h-12 text-amber-500" />
                    ) : (
                        <span className="text-2xl font-bold text-gray-400">{initials}</span>
                    )}

                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow">
                        <span className="text-lg">{node.isDeceased ? '✝️' : node.isVictim2010 ? '🔥' : statusIcon}</span>
                    </div>
                </div>

                <div className="text-center mt-2">
                    <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight break-words max-w-[150px]">{node.nom}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest my-1 ${node.side === 'paternal' ? 'text-blue-600' : node.side === 'maternal' ? 'text-red-700' : 'text-amber-800'}`}>
                        {node.side ? `Branche ${node.side}` : (node.type === 'ancetre' ? 'Ancêtre Fondateur' : node.lien || node.type || 'Lignée')}
                    </p>
                    <p className="text-sm text-stone-600 font-mono bg-stone-100 px-2 py-0.5 rounded inline-block">{period}</p>
                </div>
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className={`absolute -left-[9999px] top-0 bg-[#FDFBF7] text-stone-800 overflow-hidden z-[-1] ${isLandscape ? 'w-[1684px] h-[1190px]' : 'w-[1190px] h-[1684px]'}`}
            style={{
                // Format A3 Portrait
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"100\\"%25 height=\\"100\\"%25 xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noise\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.015\\" numOctaves=\\"3\\" stitchTiles=\\"stitch\\"%3E%3C/feTurbulence%3E%3CfeColorMatrix type=\\"matrix\\" values=\\"1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.05 0\\"%3E%3C/feColorMatrix%3E%3C/filter%3E%3Crect width=\\"100\\"%25 height=\\"100\\"%25 filter=\\"url(%23noise)\\"%3E%3C/rect%3E%3C/svg%3E")',
            }}
        >
            {/* Cadre ornemental */}
            <div className="absolute inset-8 border-4 border-double border-amber-600/30 rounded-lg pointer-events-none"></div>
            <div className="absolute inset-10 border border-amber-800/20 rounded pointer-events-none"></div>

            <div className="flex flex-col items-center pt-24 pb-12 h-full justify-between">

                {/* En-tête du Parchemin */}
                <div className="text-center mb-16 space-y-4">
                    <Crown className="w-16 h-16 mx-auto text-amber-500 mb-6" />
                    <h1 className="text-6xl font-serif font-black text-[#1c2b23] tracking-tight">Arbre Généalogique</h1>
                    <h2 className="text-3xl font-serif text-amber-700 italic">Lignée certifiée de la famille</h2>
                    <div className="w-64 h-1 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mx-auto mt-8"></div>
                </div>

                {/* Arborescence Visuelle */}
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">

                    {/* Ancêtre */}
                    {data.ancestre && (
                        <div className="relative z-10 flex flex-col items-center">
                            {renderNode(data.ancestre, true)}
                            {/* Ligne descendante */}
                            <div className="w-1 h-24 bg-gradient-to-b from-amber-500 to-amber-200/20 my-2"></div>
                        </div>
                    )}

                    {/* Parents */}
                    {data.parents && data.parents.length > 0 && (
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex justify-center gap-16 relative">
                                {/* Ligne horizontale liant les parents */}
                                {data.parents.length > 1 && (
                                    <div className="absolute top-1/2 left-[20%] right-[20%] h-1 bg-amber-200/50 -z-10"></div>
                                )}
                                {data.parents.map((p, i) => (
                                    <React.Fragment key={p.id || i}>
                                        {renderNode(p)}
                                    </React.Fragment>
                                ))}
                            </div>
                            {/* Ligne descendante */}
                            <div className="w-1 h-32 bg-gradient-to-b from-amber-200/50 to-[#124E35]/30 my-2"></div>
                        </div>
                    )}

                    {/* Self */}
                    {data.self && (
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="transform scale-125 my-8">
                                {renderNode(data.self)}
                            </div>
                            {/* Ligne descendante */}
                            {data.children && data.children.length > 0 && (
                                <div className="w-1 h-24 bg-gradient-to-b from-[#124E35]/30 to-gray-200 my-2"></div>
                            )}
                        </div>
                    )}

                    {/* Children */}
                    {data.children && data.children.length > 0 && (
                        <div className="relative z-10">
                            <div className="flex justify-center gap-8 flex-wrap max-w-4xl mt-4 relative">
                                {/* Ligne horizontale supérieure */}
                                <div className="absolute -top-12 left-[10%] right-[10%] h-0.5 bg-gray-200"></div>
                                {data.children.map((c, i) => (
                                    <div key={c.id || i} className="relative">
                                        {/* Ligne verticale filiale */}
                                        <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-gray-200 transform -translate-x-1/2"></div>
                                        {renderNode(c)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Signature */}
                <div className="mt-16 text-center w-full px-24">
                    <div className="w-full h-[1px] bg-amber-900/10 mb-6"></div>
                    <div className="flex justify-between items-center text-sm font-serif text-amber-800">
                        <p>Document officiel généré le {new Date().toLocaleDateString('fr-FR')}</p>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#124E35] flex items-center justify-center">
                                <span className="text-white text-xs font-bold">R+</span>
                            </div>
                            <span className="font-bold tracking-widest uppercase">Racines Plus</span>
                        </div>
                        <p>Certifié par le Directeur de Patrimoine Racines+</p>
                    </div>
                </div>

            </div>
        </div>
    );
});

PremiumTreeTemplate.displayName = 'PremiumTreeTemplate';

export const StandardTreeTemplate = React.forwardRef<HTMLDivElement, { data: LineageData }>(({ data }, ref) => {
    // Rend chaque nœud de manière standard (moderne, simple)
    const renderNode = (node: any, isSelf = false) => {
        if (!node) return null;
        const initials = node.nom ? node.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '??';
        return (
            <div className={`flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm border ${isSelf ? 'border-[#FF6600]' : 'border-gray-200'}`}>
                <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${isSelf ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {node.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={node.avatarUrl} alt={node.nom} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold">{initials}</span>
                    )}
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-sm text-gray-800 break-words max-w-[100px]">{node.nom}</h3>
                    <p className="text-[10px] text-gray-500 uppercase">{isSelf ? 'Vous' : node.lien || node.type || 'Parenté'}</p>
                </div>
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className="absolute -left-[9999px] top-0 w-[800px] h-[1000px] bg-gray-50 text-gray-800 overflow-hidden z-[-1] p-12 flex flex-col items-center"
        >
            <h1 className="text-3xl font-black text-[#124E35] mb-2">{data.self?.nom || 'Arbre'}</h1>
            <p className="text-sm text-gray-500 mb-12">Aperçu Généalogique Standard</p>

            <div className="flex-1 w-full flex flex-col items-center justify-center">

                {/* Parents */}
                {data.parents && data.parents.length > 0 && (
                    <div className="flex justify-center gap-12 mb-8 relative">
                        {data.parents.length > 1 && (
                            <div className="absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-gray-300 -z-10"></div>
                        )}
                        {data.parents.map((p, i) => (
                            <React.Fragment key={p.id || i}>
                                {renderNode(p)}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Self */}
                {data.self && (
                    <div className="relative mb-8">
                        {data.parents && data.parents.length > 0 && (
                            <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-300 transform -translate-x-1/2"></div>
                        )}
                        {renderNode(data.self, true)}
                    </div>
                )}

                {/* Children */}
                {data.children && data.children.length > 0 && (
                    <div className="relative mt-8">
                        <div className="absolute -top-16 left-1/2 w-0.5 h-16 bg-gray-300 transform -translate-x-1/2"></div>
                        <div className="flex justify-center gap-6 flex-wrap">
                            {data.children.map((c, i) => (
                                <div key={c.id || i} className="relative">
                                    <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-300 transform -translate-x-1/2"></div>
                                    {renderNode(c)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-center w-full">
                <p className="text-xs text-gray-500">Généré par Racines+ • Passez à la version Premium pour l'arbre complet HD.</p>
            </div>
        </div>
    );
});

StandardTreeTemplate.displayName = 'StandardTreeTemplate';
