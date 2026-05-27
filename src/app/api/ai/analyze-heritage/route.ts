import { success, error } from '@/lib/api-response';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export async function POST(req: Request) {
    const rateLimitResponse = rateLimitMiddleware(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;
    try {
        const { text, context } = await req.json();
        
        if (!text) {
            return error('Texte manquant.', 400);
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            console.warn("DEEPSEEK_API_KEY non définie. Utilisation du mock d'analyse.");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return success({ 
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
            const errData = await response.json();
            throw new Error(`Erreur DeepSeek API: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";
        
        return success({ 
            analysis: content,
            raw_response: content
        });
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error("Erreur Analyse DeepSeek:", e);
        return error(e.message, 500);
    }
}
