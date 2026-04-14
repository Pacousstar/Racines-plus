import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audio = formData.get('audio') as Blob;
        
        if (!audio) {
            return NextResponse.json({ error: 'Fichier audio manquant.' }, { status: 400 });
        }

        // TODO: Brancher l'API OpenAI Whisper ou DeepSeek ici
        // Simulation en attendant la clé API :
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockTranscription = "Je m'appelle Gbéya et voici l'histoire de la famille de Toa Zéo. L'ancêtre fondateur est arrivé vers 1850 pour cultiver ces terres...";
        
        return NextResponse.json({ text: mockTranscription });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
