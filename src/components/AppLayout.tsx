"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell, Search, Globe } from 'lucide-react';
import Link from 'next/link';

interface AppLayoutProps {
    children: React.ReactNode;
    role: string;
    activeTab: string;
    onTabChange: (id: any) => void;
    userName: string;
    userAvatar: string | null;
    village?: string;
    onLogout: () => void;
}

export default function AppLayout({
    children,
    role,
    activeTab,
    onTabChange,
    userName,
    userAvatar,
    village,
    onLogout
}: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Sidebar */}
            <Sidebar
                role={role}
                activeTab={activeTab}
                onTabChange={onTabChange}
                userName={userName}
                userAvatar={userAvatar}
                village={village}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main Content Area */}
            <div className={`transition-all duration-300 lg:pl-72`}>

                {/* Topbar */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden md:flex items-center gap-3">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{activeTab.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 gap-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="bg-transparent border-none text-xs font-bold outline-none w-32 focus:w-48 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2.5 text-gray-400 hover:text-[#FF6600] hover:bg-orange-50 rounded-2xl transition-all relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6600] rounded-full border-2 border-white" />
                            </button>
                            <button className="p-2.5 text-gray-400 hover:text-[#124e35] hover:bg-green-50 rounded-2xl transition-all">
                                <Globe className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Zone de Contenu */}
                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
