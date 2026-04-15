import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { profile, parents, heritage } = await req.json();
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!profile || !profile.lastName) {
            return NextResponse.json({ error: 'Données de profil manquantes.' }, { status: 400 });
        }

        // --- MOTEUR NARRATIF "GRIOT RACINES+" (DEEPSEEK REAL) ---
        if (!apiKey) {
            // Fallback Simulation si pas de clé
            return NextResponse.json({ 
                story: `L'Épopée de la Maison ${profile.lastName.toUpperCase()}. (Clé API manquante pour la génération réelle)`, 
                message: "Simulation active (DEEPSEEK_API_KEY non trouvée)." 
            });
        }

        const village = profile.village || "Toa-Zéo";
        const lastName = profile.lastName.toUpperCase();
        const firstName = profile.firstName;
        
        const paternalNames = parents.filter((p: any) => p.side === 'paternal').map((p: any) => p.nom).join(', ');
        const maternalNames = parents.filter((p: any) => p.side === 'maternal').map((p: any) => p.nom).join(', ');
        const proverbs = heritage?.proverbs ? heritage.proverbs.join('; ') : "";

        const systemPrompt = `Tu es un Griot africain traditionnel, gardien de la mémoire de Toa-Zéo. Ton rôle est de raconter l'épopée d'une lignée familiale avec noblesse, poésie et sagesse. Utilise des métaphores liées à la terre, aux racines et aux ancêtres.`;
        
        const userPrompt = `Raconte l'épopée de la famille ${lastName}, représentée aujourd'hui par ${firstName}. 
        Son village est ${village}. 
        Ses ancêtres paternels incluent : ${paternalNames}. 
        Ses racines maternelles incluent : ${maternalNames}. 
        Sagesse du village à inclure : ${proverbs}.
        Le récit doit être structuré, émouvant et solennel.`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const narrative = data.choices?.[0]?.message?.content || "Le souffle des ancêtres est silencieux pour le moment.";

        return NextResponse.json({ 
            story: narrative, 
            message: "Épopée générée avec succès par l'IA DeepSeek." 
        });

    } catch (e: any) {
        console.error("DeepSeek Storytelling Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
