import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audio = formData.get('audio') as Blob;
        
        if (!audio) {
            return NextResponse.json({ error: 'Fichier audio manquant.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.warn("OPENAI_API_KEY non définie. Utilisation du mock audio.");
            // Simulation en attendant la clé API :
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockTranscription = "Je m'appelle Gbéya et voici l'histoire de la famille de Toa Zéo. L'ancêtre fondateur est arrivé vers 1850 pour cultiver ces terres...";
            return NextResponse.json({ text: mockTranscription });
        }

        // --- Appel Réel à OpenAI Whisper ---
        const openAiFormData = new FormData();
        openAiFormData.append('file', audio, 'audio.webm'); // ou 'audio.wav'
        openAiFormData.append('model', 'whisper-1');
        openAiFormData.append('language', 'fr'); // Forcer le français ou laisser vide pour l'autodétection

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: openAiFormData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Erreur Whisper API: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });
        
    } catch (e: any) {
        console.error("Erreur Dictaphone:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
