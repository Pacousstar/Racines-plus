import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { emailTo, inviterName, villageNom, inviteLink } = await request.json();

        if (!emailTo || !emailTo.includes('@')) {
            return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            // Pas de clé Resend → on log et on renvoie succès avec message informatif
            console.warn('[send-invitation] RESEND_API_KEY non configurée');
            return NextResponse.json({
                success: false,
                message: 'Système email non configuré. Partagez le lien directement.',
            });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://racines-plus.vercel.app';
        const finalLink = inviteLink || `${siteUrl}/onboarding`;

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'noreply@resend.dev',
                to: emailTo,
                subject: `${inviterName || 'Quelqu\'un'} vous invite sur Racines+`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                        <img src="${siteUrl}/LOGO_Racines.png" alt="Racines+" style="height: 40px; margin-bottom: 24px;" />
                        <h1 style="color: #FF6600; font-size: 24px;">Rejoignez votre arbre généalogique 🌳</h1>
                        <p style="color: #333; line-height: 1.6;">Bonjour,</p>
                        <p style="color: #333; line-height: 1.6;">
                            <strong>${inviterName || 'Un membre de votre famille'}</strong> vous invite à rejoindre
                            Racines+ pour construire ensemble l'arbre généalogique du village de
                            <strong>${villageNom || 'Toa-Zéo'}</strong>.
                        </p>
                        <p style="color: #333; line-height: 1.6;">
                            Racines+ est la forteresse numérique souveraine qui préserve la mémoire africaine
                            pour les 50 prochaines années.
                        </p>
                        <a href="${finalLink}"
                           style="display: inline-block; background: #FF6600; color: white; padding: 14px 28px;
                                  border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;
                                  margin: 24px 0;">
                            Créer mon profil gratuit →
                        </a>
                        <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
                            Données chiffrées • Souveraineté africaine • Racines+ MVP<br/>
                            Village de ${villageNom || 'Toa-Zéo'} — Côte d'Ivoire
                        </p>
                    </div>
                `,
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('[send-invitation] Resend error:', errData);
            return NextResponse.json({ error: 'Échec de l\'envoi email', detail: errData }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Invitation envoyée avec succès !' });

    } catch (err: unknown) {
        console.error('[send-invitation] Unexpected error:', err);
        const message = err instanceof Error ? err.message : 'Erreur inattendue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
