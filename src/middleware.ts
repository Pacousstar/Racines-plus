import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.cookies.set({ name, value, ...options });
                    });
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = req.nextUrl;

    // Routes publiques (toujours accessibles)
    const publicRoutes = ['/', '/login', '/onboarding', '/api'];
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r));

    // Si non connecté et route protégée → rediriger vers /login
    if (!user && !isPublic) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Si connecté, récupérer le rôle
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'user';

        // Protéger /admin : seulement pour les admins
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Protéger /cho : seulement pour cho et choa
        if (pathname.startsWith('/cho') && !['cho', 'choa'].includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Si connecté et sur /login ou /onboarding, rediriger vers le bon dashboard
        if (['/login', '/onboarding'].includes(pathname)) {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
            if (['cho', 'choa'].includes(role)) return NextResponse.redirect(new URL('/cho', req.url));
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
