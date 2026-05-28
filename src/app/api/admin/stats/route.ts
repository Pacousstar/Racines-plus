import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';
import { error } from '@/lib/api-response';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return error('Non autorisé', 401);

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return error('Non autorisé', 401);

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return error('Accès réservé aux admins', 403);
    }

    const key = cacheKey('admin', 'stats');
    const cached = await cacheGet<Record<string, unknown>>(key);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const [
        { count: total },
        { count: confirmed },
        { count: pending },
        { count: rejected },
        { data: genderData },
        { data: educationData },
        { data: villageData },
        { count: certificateIssued },
        { count: certificateRequested },
        { count: exportAuthorized },
        { count: exportRequested },
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabaseAdmin.from('profiles').select('gender'),
        supabaseAdmin.from('profiles').select('niveau_etudes'),
        supabaseAdmin.from('profiles').select('village_origin'),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('certificate_issued', true),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('certificate_requested', true),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('export_authorized', true),
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('export_requested', true),
    ]);

    const genderBreakdown = { male: 0, female: 0, other: 0 };
    (genderData || []).forEach((p) => {
        if (p.gender === 'male' || p.gender === 'M' || p.gender === 'masculin') genderBreakdown.male++;
        else if (p.gender === 'female' || p.gender === 'F' || p.gender === 'feminin') genderBreakdown.female++;
        else genderBreakdown.other++;
    });

    const educationLevels: Record<string, number> = {};
    (educationData || []).forEach((p) => {
        const level = p.niveau_etudes || 'non_renseigne';
        educationLevels[level] = (educationLevels[level] || 0) + 1;
    });

    const villageCounts: Record<string, number> = {};
    (villageData || []).forEach((p) => {
        const v = p.village_origin || 'non_renseigne';
        villageCounts[v] = (villageCounts[v] || 0) + 1;
    });
    const villages = Object.entries(villageCounts)
        .map(([nom, count]) => ({ nom, count }))
        .sort((a, b) => b.count - a.count);

    const stats = {
        total: total || 0,
        confirmed: confirmed || 0,
        pending: pending || 0,
        rejected: rejected || 0,
        genderBreakdown,
        educationLevels,
        villages,
        certificates: { issued: certificateIssued || 0, requested: certificateRequested || 0 },
        exports: { authorized: exportAuthorized || 0, requested: exportRequested || 0 },
        recours: 0,
    };

    await cacheSet(key, stats, 300);

    return NextResponse.json({ success: true, data: stats });
}
