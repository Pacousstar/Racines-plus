import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // 1. Routes protégées par rôle
    const ROLE_ROUTES: Record<string, string[]> = {
        '/admin': ['admin'],
        '/cho': ['cho', 'admin'],
        '/choa': ['choa', 'cho', 'admin', 'assistant cho', 'assistant_cho'],
    }

    // 2. Routes qui nécessitent simplement d'être connecté
    const AUTH_ROUTES = ['/dashboard', '/annuaire', '/evenements']

    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
    // Trier les routes par longueur décroissante pour éviter que /cho ne matche /choa
    const sortedRoleRoutes = Object.entries(ROLE_ROUTES).sort(([a], [b]) => b.length - a.length)
    const roleRouteEntry = sortedRoleRoutes.find(([r]) => pathname.startsWith(r))
    const isProtected = isAuthRoute || !!roleRouteEntry

    // Redirection si non connecté
    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(url)
    }

    // 3. Logique de redirection et protection (une seule passe)
    if (user) {
        // Pour les pages critiques (landing, login, dashboard) ou les routes protégées par rôle
        const isEntryPage = pathname === '/login' || pathname === '/' || pathname === '/dashboard'
        
        if (isEntryPage || roleRouteEntry) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )
            const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
            const role = (profile?.role || 'user').toLowerCase().trim()

            // A. Redirection forcée vers l'espace de rôle si sur une page d'entrée
            if (isEntryPage) {
                let targetPath = '/dashboard'
                if (role === 'admin') targetPath = '/admin'
                else if (role === 'cho') targetPath = '/cho'
                else if (role === 'choa' || role === 'assistant cho' || role === 'assistant_cho') targetPath = '/choa'

                if (pathname !== targetPath) {
                    const url = request.nextUrl.clone()
                    url.pathname = targetPath
                    return NextResponse.redirect(url)
                }
            }

            // B. Vérification d'accès pour les routes protégées
            if (roleRouteEntry) {
                const [, allowedRoles] = roleRouteEntry
                if (!allowedRoles.includes(role)) {
                    console.warn(`[Middleware] Access denied for ${user.email} to ${pathname}. Role: ${role}. Redirecting to /dashboard`)
                    const url = request.nextUrl.clone()
                    url.pathname = '/dashboard'
                    return NextResponse.redirect(url)
                }
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
