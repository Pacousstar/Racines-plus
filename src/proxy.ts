import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes protégées par rôle
const ROLE_ROUTES: Record<string, string[]> = {
    '/admin': ['admin'],
    '/cho': ['cho', 'admin'],
    '/choa': ['choa', 'cho', 'admin'],
};

// Routes qui nécessitent simplement d'être connecté
const AUTH_ROUTES = ['/dashboard', '/annuaire', '/evenements'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Routes publiques — toujours accessibles
    const publicRoutes = ['/', '/login', '/onboarding', '/api', '/_next', '/favicon'];
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r));
    if (isPublic) return NextResponse.next();

    // Vérifier si la route est protégée
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
    const roleRouteEntry = Object.entries(ROLE_ROUTES).find(([r]) => pathname.startsWith(r));
    const isProtected = isAuthRoute || !!roleRouteEntry;

    if (!isProtected) return NextResponse.next();

    // Construire la réponse (pour pouvoir y attacher les cookies)
    const response = NextResponse.next({ request });

    // Créer un client Supabase côté serveur (lit les cookies de session)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Pas connecté → login
    if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Si connecté et sur /login ou /onboarding → rediriger vers le bon dashboard
    if (['/login', '/onboarding'].includes(pathname)) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || 'user';
        if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        if (role === 'cho') return NextResponse.redirect(new URL('/cho', request.url));
        if (role === 'choa') return NextResponse.redirect(new URL('/choa', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Vérification du rôle pour les routes admin/cho/choa
    if (roleRouteEntry) {
        const [, allowedRoles] = roleRouteEntry;
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role || 'user';

        if (!allowedRoles.includes(userRole)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
