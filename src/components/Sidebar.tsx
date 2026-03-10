"use client";

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    Home, Users, TreePine, ShieldCheck, Flame,
    BarChart3, Shield, Map, Share2, Stamp,
    Settings, LogOut, ChevronRight, Bell, Menu, X
} from 'lucide-react';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    color?: string;
}

interface SidebarProps {
    role: string;
    activeTab: string;
    onTabChange: (id: any) => void;
    userName: string;
    userAvatar: string | null;
    village?: string;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
    role,
    activeTab,
    onTabChange,
    userName,
    userAvatar,
    village,
    onLogout,
    isOpen,
    setIsOpen
}: SidebarProps) {

    const getNavItems = (): NavItem[] => {
        const common = [
            { id: 'mon_arbre', label: 'Mon Arbre', icon: TreePine },
            { id: 'memorial', label: 'Mémorial 2010', icon: Flame, color: 'text-red-500' },
        ];

        if (role === 'admin') {
            return [
                { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                ...common,
                { id: 'users', label: 'Comptes & Rôles', icon: Users },
                { id: 'assistants', label: 'Assistants Admin', icon: Shield },
                { id: 'villages', label: 'Villages & Quartiers', icon: Map },
                { id: 'validations', label: 'Validations', icon: ShieldCheck },
                { id: 'invitations', label: 'Invitations', icon: Share2 },
                { id: 'certificates', label: 'Certificats', icon: Stamp },
                { id: 'settings', label: 'Paramètres', icon: Settings },
            ];
        }

        if (role === 'cho') {
            return [
                ...common,
                { id: 'tasks', label: 'À valider', icon: ShieldCheck },
                { id: 'confirmed', label: 'Certifiés', icon: Stamp },
                { id: 'ancestor', label: 'Ancêtre Village', icon: Map },
                { id: 'team', label: 'Mon Équipe', icon: Users },
            ];
        }

        if (role === 'choa') {
            return [
                ...common,
                { id: 'tasks', label: 'Pré-validations', icon: ShieldCheck },
                { id: 'sent_cho', label: 'Envoyés au CHO', icon: ChevronRight },
                { id: 'quartier', label: 'Activité Quartier', icon: Users },
            ];
        }

        // Default role === 'user'
        return [
            ...common,
            { id: 'migration', label: 'Carte Migration', icon: Map },
            { id: 'certificate', label: 'Mon Certificat', icon: Stamp },
        ];
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full z-[70]
                w-72 bg-white border-r border-gray-100 shadow-2xl transition-transform duration-300 ease-in-out
                flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo Section */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-10 h-10 overflow-hidden">
                            <Image src="/LOGO_Racines.png" alt="Racines+" fill className="object-contain mix-blend-multiply" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-[#124e35]">RACINES<span className="text-[#FF6600]">+</span></span>
                    </Link>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 mb-6">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 no-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onTabChange(item.id);
                                if (window.innerWidth < 1024) setIsOpen(false);
                            }}
                            className={`
                                w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300
                                group relative
                                ${activeTab === item.id
                                    ? 'bg-[#FF6600] text-white shadow-lg shadow-[#FF6600]/30 translate-x-1'
                                    : 'text-gray-500 hover:bg-orange-50 hover:text-[#FF6600] hover:translate-x-1'}
                            `}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color || 'group-hover:text-[#FF6600]'}`} />
                            <span className="flex-1 text-left">{item.label}</span>
                            {activeTab === item.id && (
                                <ChevronRight className="w-4 h-4 text-white/70" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom Profile Section */}
                <div className="p-6 mt-auto">
                    <div className="bg-gray-50/80 backdrop-blur-md rounded-3xl p-4 border border-gray-100 shadow-inner">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF6600] to-amber-400 rounded-2xl blur-sm opacity-20" />
                                <div className="relative w-10 h-10 rounded-2xl bg-white overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-[#FF6600] font-black">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        userName[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-gray-900 truncate">{userName}</p>
                                <p className="text-[10px] font-bold text-[#FF6600] uppercase tracking-wider truncate">{role.toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {village && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-100 text-[10px] font-bold text-gray-500">
                                    <Map className="w-3 h-3 text-[#124e35]" />
                                    <span className="truncate">{village}</span>
                                </div>
                            )}
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider transition-colors border border-transparent hover:border-red-100"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
