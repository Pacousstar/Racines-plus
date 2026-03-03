import React from 'react';
import { MapPin, Briefcase, GraduationCap, Phone } from 'lucide-react';

interface MemberCardProps {
    member: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        emploi: string | null;
        fonction: string | null;
        niveau_etudes: string | null;
        residence_city: string | null;
        address_country: string | null;
        quartier_nom: string | null;
        whatsapp_1: string | null;
        is_deceased: boolean;
        disease_type: string | null;
    };
}

export default function MemberCard({ member }: MemberCardProps) {
    const isDiaspora = member.address_country && member.address_country !== "Côte d'Ivoire";

    // Déterminer la couleur de la bordure et du fond selon le statut (Décédé, Diaspora, Local)
    let borderClass = "border-gray-100 dark:border-white/10";
    let bgClass = "bg-white dark:bg-black";
    let badge = null;

    if (member.is_deceased) {
        bgClass = "bg-gray-50 dark:bg-gray-900";
        borderClass = member.disease_type === '2010_crisis' ? "border-red-200" : "border-gray-200";
        badge = <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full ${member.disease_type === '2010_crisis' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>🕊️ Repose en Paix</span>;
    } else if (isDiaspora) {
        borderClass = "border-blue-100";
        badge = <span className="absolute top-3 right-3 bg-blue-50 text-blue-600 px-2 py-0.5 text-[10px] font-bold rounded-full">✈️ Diaspora</span>;
    }

    return (
        <div className={`relative flex flex-col p-5 rounded-2xl border ${borderClass} ${bgClass} shadow-sm hover:shadow-md transition-shadow group`}>
            {badge}

            <div className="flex items-start gap-4 mb-4">
                <img
                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=124E35&color=fff`}
                    alt={`${member.first_name} ${member.last_name}`}
                    className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm ${member.is_deceased ? 'border-gray-300 grayscale' : 'border-[#FF6600]'}`}
                    loading="lazy"
                />
                <div className="pt-1">
                    <h3 className="font-black text-gray-900 text-lg leading-tight flex items-center gap-2">
                        {member.first_name} {member.last_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#124E35]">
                        <span className="w-2 h-2 rounded-full bg-[#124E35]"></span>
                        Quartier {member.quartier_nom || 'Inconnu'}
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-6 flex-grow">
                {member.emploi && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span><span className="font-medium text-gray-900">{member.emploi}</span> {member.fonction ? `- ${member.fonction}` : ''}</span>
                    </div>
                )}
                {member.niveau_etudes && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{member.niveau_etudes}</span>
                    </div>
                )}
                {(member.residence_city || member.address_country) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{member.residence_city}{member.residence_city && member.address_country ? ', ' : ''}{member.address_country}</span>
                    </div>
                )}
            </div>

            {!member.is_deceased && member.whatsapp_1 && (
                <a
                    href={`https://wa.me/${member.whatsapp_1.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-bold rounded-xl transition-colors"
                >
                    <Phone className="w-4 h-4" />
                    Contacter via WhatsApp
                </a>
            )}
        </div>
    );
}
