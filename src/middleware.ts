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

    // Routes protégées par rôle
    const ROLE_ROUTES: Record<string, string[]> = {
        '/admin': ['admin'],
        '/cho': ['cho', 'admin'],
        '/choa': ['choa', 'cho', 'admin', 'assistant cho', 'assistant_cho'],
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

    if (user && (pathname === '/login' || pathname === '/' || pathname === '/dashboard')) {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
        const role = (profile?.role || 'user').toLowerCase().trim()
        
        let targetPath = '/dashboard'
        if (role === 'admin') targetPath = '/admin'
        else if (role === 'cho') targetPath = '/cho'
        else if (role === 'choa' || role === 'assistant cho' || role === 'assistant_cho') targetPath = '/choa'
        
        // Rediriger seulement si on n'est pas déjà sur la bonne route
        if (pathname !== targetPath) {
            const url = request.nextUrl.clone()
            url.pathname = targetPath
            console.log(`[Middleware] Global Redirect: ${user.email} from ${pathname} to ${targetPath} (role: ${role})`)
            return NextResponse.redirect(url)
        }
    }

    // Vérification du rôle spécifique
    if (user && roleRouteEntry) {
        const [, allowedRoles] = roleRouteEntry
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
        const userRole = (profile?.role || 'user').toLowerCase().trim()
        
        if (!allowedRoles.includes(userRole)) {
            console.warn(`[Middleware] Access denied for ${user.email} to ${pathname}. Role: ${userRole}. Redirecting to /dashboard`)
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
