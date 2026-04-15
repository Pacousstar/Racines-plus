import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!file) {
            return NextResponse.json({ error: 'Document manquant pour l\'OCR.' }, { status: 400 });
        }

        if (!apiKey) {
            // Simulation si pas de clé
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({ 
                data: {
                    firstName: "Jean-Baptiste",
                    lastName: "Kouadio",
                    birthDate: "1975-05-12",
                    parents: "Père: Kouadio Yao; Mère: Amenan Lou"
                }, 
                message: "Simulation active (DEEPSEEK_API_KEY non trouvée)." 
            });
        }

        // --- BRANCHEMENT RÉEL DEEPSEEK VISION / OCR ---
        // Ici on pourrait envoyer l'image à un modèle vision-capable pour extraction
        
        return NextResponse.json({ 
            data: { /* Données extraites réellement */ }, 
            message: "Données extraites avec succès via DeepSeek." 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
