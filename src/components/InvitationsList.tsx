"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Share2, CheckCircle, Clock } from 'lucide-react';

interface Invitation {
    id: string;
    email_invite: string;
    created_at: string;
    status: 'inscrit' | 'non_inscrit';
}

export default function InvitationsList({ userId }: { userId: string }) {
    const supabase = createClient();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvitations = async () => {
            if (!userId) return;
            setIsLoading(true);

            // 1. Récupérer les invitations envoyées par cet utilisateur
            const { data: invs, error } = await supabase
                .from('invitations')
                .select('*')
                .eq('inviter_id', userId)
                .order('created_at', { ascending: false });

            if (error || !invs) {
                console.error("Erreur chargement invitations", error);
                setIsLoading(false);
                return;
            }

            // 2. Vérifier si l'email invité existe via l'API
            if (invs && invs.length > 0) {
                const emails = invs.map(inv => inv.email_invite).filter(Boolean);
                try {
                    const res = await fetch('/api/check-invites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emails })
                    });
                    if (res.ok) {
                        const { statuses } = await res.json();

                        const formattedInvs = invs.map(inv => ({
                            id: inv.id,
                            email_invite: inv.email_invite,
                            created_at: new Date(inv.created_at).toLocaleDateString('fr-FR'),
                            status: (statuses[inv.email_invite] || 'non_inscrit') as 'inscrit' | 'non_inscrit'
                        }));
                        setInvitations(formattedInvs);
                        setIsLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("Erreur de vérification des statuts d'invitation", err);
                }
            }

            // Fallback en cas d'erreur ou liste vide
            const formattedInvs = (invs || []).map(inv => ({
                id: inv.id,
                email_invite: inv.email_invite,
                created_at: new Date(inv.created_at).toLocaleDateString('fr-FR'),
                status: 'non_inscrit' as const
            }));

            setInvitations(formattedInvs);
            setIsLoading(false);
        };

        fetchInvitations();
    }, [userId, supabase]);

    if (isLoading) {
        return <div className="animate-pulse space-y-3 mt-4">
            <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
            <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
        </div>;
    }

    return (
        <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-gray-800">Historique d'invitations ({invitations.length})</h3>
            </div>
            {invitations.length === 0 ? (
                <div className="bg-white border text-center border-gray-100 rounded-3xl p-8 mt-4">
                    <Share2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-700">Aucune invitation envoyée</h3>
                    <p className="text-sm text-gray-400 mt-1">Invitez des membres de votre famille pour agrandir l'arbre.</p>
                </div>
            ) : (
                invitations.map(inv => (
                    <div key={inv.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-orange-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <Share2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{inv.email_invite}</p>
                                <p className="text-xs text-gray-400">Envoyé le {inv.created_at}</p>
                            </div>
                        </div>
                        <div>
                            {inv.status === 'inscrit' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                    <CheckCircle className="w-3.5 h-3.5" /> Inscrit(e)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                                    <Clock className="w-3.5 h-3.5" /> En attente
                                </span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
