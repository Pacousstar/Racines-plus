import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, context } = await req.json();
        
        if (!text) {
            return NextResponse.json({ error: 'Texte manquant.' }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            console.warn("DEEPSEEK_API_KEY non définie. Utilisation du mock d'analyse.");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return NextResponse.json({ 
                analysis: "L'ancêtre a été détecté. Liens familiaux suggérés fondés sur Toa-Zéo.",
                entities: ["Gbéya", "Toa Zéo", "1850"],
                logic_check: "Aucune anomalie temporelle détectée."
            });
        }

        // --- Appel Réel à DeepSeek API ---
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek-chat", // ou "deepseek-reasoner"
                messages: [
                    {
                        role: "system",
                        content: `Tu es un expert en généalogie et patrimoine culturel africain (spécialité Région du Guémon, Côte d'Ivoire).
                        Ton rôle est d'analyser ce récit oral transcrit.
                        1. Extrais les personnes mentionnées et leurs liens.
                        2. Identifie les lieux, les dates (même approximatives).
                        3. Signale s'il y a des incohérences logiques (ex: enfant né avant le parent).
                        Renvoie le résultat au format JSON lisible.`
                    },
                    {
                        role: "user",
                        content: `Contexte: ${context || 'Généalogie Toa-Zéo'}\nRécit oral: ${text}`
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Erreur DeepSeek API: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";
        
        return NextResponse.json({ 
            analysis: content,
            raw_response: content
        });
        
    } catch (e: any) {
        console.error("Erreur Analyse DeepSeek:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
