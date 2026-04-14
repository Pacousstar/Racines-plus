import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        
        if (!file) {
            return NextResponse.json({ error: 'Document manquant pour l\'OCR.' }, { status: 400 });
        }

        // TODO: Brancher l'API DeepSeek OCR ou GPT-4 Vision ici
        // Simulation en attendant la clé :
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const extractedData = {
            firstName: "Détecté via IA",
            lastName: "Gbéya",
            birthDate: "1980-01-01",
            parents: "Informations parents lues"
        };
        
        return NextResponse.json({ data: extractedData, message: "Données extraites avec succès via OCR." });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
