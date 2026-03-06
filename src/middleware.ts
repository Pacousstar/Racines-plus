import { createServerClient } from '@supabase/ssr'
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

    // Routes protégées par rôle
    const ROLE_ROUTES: Record<string, string[]> = {
        '/admin': ['admin'],
        '/cho': ['cho', 'admin'],
        '/choa': ['choa', 'cho', 'admin'],
    }

    // Routes qui nécessitent simplement d'être connecté
    const AUTH_ROUTES = ['/dashboard', '/annuaire', '/evenements']

    // Vérifier si la route est protégée
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
    const roleRouteEntry = Object.entries(ROLE_ROUTES).find(([r]) => pathname.startsWith(r))
    const isProtected = isAuthRoute || !!roleRouteEntry

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(url)
    }

    if (user && (pathname === '/login' || pathname === '/')) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const role = profile?.role || 'user'
        const url = request.nextUrl.clone()
        if (role === 'admin') url.pathname = '/admin'
        else if (role === 'cho') url.pathname = '/cho'
        else if (role === 'choa') url.pathname = '/choa'
        else url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Vérification du rôle spécifique
    if (user && roleRouteEntry) {
        const [, allowedRoles] = roleRouteEntry
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const userRole = profile?.role || 'user'
        if (!allowedRoles.includes(userRole)) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
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
