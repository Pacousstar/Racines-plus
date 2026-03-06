import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
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
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Rafraîchir le token si nécessaire
    const { data: { user } } = await supabase.auth.getUser()

    // Logique de protection des routes
    const url = request.nextUrl.clone()

    // Routes protégées
    const isAdminRoute = url.pathname.startsWith('/admin')
    const isChoRoute = url.pathname.startsWith('/cho')
    const isChoaRoute = url.pathname.startsWith('/choa')
    const isDashboardRoute = url.pathname.startsWith('/dashboard')
    const isOnboardingRoute = url.pathname.startsWith('/onboarding')
    const isAnnuaireRoute = url.pathname.startsWith('/annuaire')
    const isEvenementsRoute = url.pathname.startsWith('/evenements')

    const isProtectedRoute = isAdminRoute || isChoRoute || isChoaRoute || isDashboardRoute || isOnboardingRoute || isAnnuaireRoute || isEvenementsRoute

    if (!user && isProtectedRoute) {
        // Rediriger vers login si non connecté
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Optionnel : Récupérer le rôle pour une protection plus fine
        // Note: getUser() est rapide, mais fetcher le profil à chaque requête middleware 
        // peut ralentir. On peut aussi stocker le rôle dans les user_metadata.

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        // Protection par rôle
        if (isAdminRoute && role !== 'admin') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        if (isChoRoute && role !== 'cho' && role !== 'admin') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        if (isChoaRoute && role !== 'choa' && role !== 'admin') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Si l'utilisateur est déjà sur /login mais connecté, rediriger vers son dashboard
        if (url.pathname === '/login') {
            if (role === 'admin') url.pathname = '/admin'
            else if (role === 'cho') url.pathname = '/cho'
            else if (role === 'choa') url.pathname = '/choa'
            else url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
