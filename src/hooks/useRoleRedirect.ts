import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type AllowedRole = 'admin' | 'cho' | 'choa' | 'user' | 'ambassadeur' | 'assistant cho' | 'assistant_cho';

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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }

            try {
                const response = await fetch('/api/me', {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });

                if (!response.ok) {
                    console.error('🛡️ [useRoleRedirect] API Error:', await response.text());
                    return;
                }

                const { profile } = await response.json();
                const userRole = profile?.role as AllowedRole | undefined;
                
                console.log(`🛡️ [useRoleRedirect] User: ${session.user.email}, Role detected: "${userRole}", Allowed: [${allowedRoles.join(', ')}]`);

                if (!userRole || !allowedRoles.includes(userRole)) {
                    console.warn(`🛡️ [useRoleRedirect] Access denied. Redirecting...`);
                    const currentPath = window.location.pathname;
                    let targetPath = '/dashboard';
                    
                    if (userRole === 'admin') targetPath = '/admin';
                    else if (userRole === 'cho') targetPath = '/cho';
                    else if (userRole === 'choa' || userRole === 'assistant cho' || userRole === 'assistant_cho') targetPath = '/choa';

                    if (currentPath !== targetPath && !currentPath.startsWith(targetPath)) {
                        router.replace(targetPath);
                    } else {
                        console.log('🛡️ [useRoleRedirect] Already on correct path, stopping redirect.');
                    }
                } else {
                    console.log('🛡️ [useRoleRedirect] Access granted ✅');
                }
            } catch (err) {
                console.error('🛡️ [useRoleRedirect] Fetch error:', err);
            }
        };

        checkRole();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
