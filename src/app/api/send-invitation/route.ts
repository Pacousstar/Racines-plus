import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { emailTo, inviterName, villageNom, inviteLink } = body;

        // Validation
        if (!emailTo || !emailTo.includes('@')) {
            return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;

        // Log pour debug (visible dans Vercel Function Logs)
        console.log('[send-invitation] Payload:', { emailTo, inviterName, villageNom });
        console.log('[send-invitation] RESEND_API_KEY présente :', !!resendApiKey, resendApiKey?.slice(0, 8));

        if (!resendApiKey) {
            console.warn('[send-invitation] RESEND_API_KEY manquante dans les variables d\'environnement');
            return NextResponse.json({
                success: false,
                message: 'RESEND_API_KEY non configurée côté serveur.',
            });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://racines-plus.vercel.app';
        const finalLink = inviteLink || `${siteUrl}/onboarding`;

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'noreply@resend.dev',
                to: emailTo,
                subject: `${inviterName || 'Un proche'} vous invite à rejoindre Racines+`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
                        <h1 style="color: #FF6600; font-size: 22px; margin-bottom: 8px;">Rejoignez votre arbre généalogique 🌳</h1>
                        <p style="color: #555; line-height: 1.7; margin-bottom: 12px;">Bonjour,</p>
                        <p style="color: #555; line-height: 1.7; margin-bottom: 12px;">
                            <strong style="color: #222;">${inviterName || 'Un membre de votre famille'}</strong>
                            vous invite à rejoindre <strong>Racines+</strong> pour construire ensemble
                            l'arbre généalogique du village de <strong>${villageNom || 'Toa-Zéo'}</strong>.
                        </p>
                        <p style="color: #555; line-height: 1.7; margin-bottom: 24px;">
                            Racines+ est la forteresse numérique souveraine qui préserve la mémoire africaine
                            pour les 50 prochaines années.
                        </p>
                        <a href="${finalLink}"
                           style="display: inline-block; background: #FF6600; color: #fff; padding: 14px 32px;
                                  border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;
                                  letter-spacing: 0.3px; margin-bottom: 24px;">
                            Créer mon profil gratuit →
                        </a>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="color: #aaa; font-size: 11px; line-height: 1.6;">
                            Données chiffrées • Souveraineté africaine • Racines+ MVP<br/>
                            Village de ${villageNom || 'Toa-Zéo'} — Côte d'Ivoire
                        </p>
                    </div>
                `,
            }),
        });

        const resendData = await resendResponse.json();

        // Log la réponse Resend pour debug
        console.log('[send-invitation] Resend status:', resendResponse.status, JSON.stringify(resendData));

        if (!resendResponse.ok) {
            console.error('[send-invitation] Resend a rejeté l\'email:', resendData);
            return NextResponse.json(
                { error: 'Resend a rejeté l\'email. Vérifiez que votre domaine est validé et que EMAIL_FROM est correct.', detail: resendData },
                { status: resendResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Invitation envoyée à ${emailTo} !`,
            resendId: resendData.id,
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur inattendue';
        console.error('[send-invitation] Exception:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
