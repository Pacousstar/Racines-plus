import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type AllowedRole = 'admin' | 'cho' | 'choa' | 'user' | 'ambassadeur';

/**
 * Hook useRoleRedirect
 * 
 * Protège une page côté client selon le(s) rôle(s) autorisé(s).
 * Si l'utilisateur n'est pas connecté → redirige vers /login
 * Si le rôle ne correspond pas → redirige vers /dashboard
 * 
 * @param allowedRoles - liste des rôles autorisés à accéder à cette page
 * 
 * Exemple d'usage dans une page :
 *   useRoleRedirect(['admin'])          // admin seulement
 *   useRoleRedirect(['cho', 'choa'])    // CHO et CHOa
 *   useRoleRedirect(['user'])           // utilisateur de base
 */
export function useRoleRedirect(allowedRoles: AllowedRole[]) {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role as AllowedRole | undefined;

            if (!userRole || !allowedRoles.includes(userRole)) {
                // Redirection vers le bon dashboard selon le rôle réel
                if (userRole === 'admin') router.replace('/admin');
                else if (userRole === 'cho') router.replace('/cho');
                else if (userRole === 'choa') router.replace('/choa');
                else if (userRole === 'ambassadeur') router.replace('/dashboard'); // Les ambassadeurs voient le dashboard standard plus options
                else router.replace('/dashboard');
            }
        };

        checkRole();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
