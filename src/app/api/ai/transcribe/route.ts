import { success, error } from '@/lib/api-response';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export async function POST(req: Request) {
    const rateLimitResponse = rateLimitMiddleware(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;
    try {
        const formData = await req.formData();
        const audio = formData.get('audio') as Blob;
        
        if (!audio) {
            return error('Fichier audio manquant.', 400);
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.warn("OPENAI_API_KEY non définie. Utilisation du mock audio.");
            // Simulation en attendant la clé API :
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockTranscription = "Je m'appelle Gbéya et voici l'histoire de la famille de Toa Zéo. L'ancêtre fondateur est arrivé vers 1850 pour cultiver ces terres...";
            return success({ text: mockTranscription });
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
            const errData = await response.json();
            throw new Error(`Erreur Whisper API: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return success({ text: data.text });
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error("Erreur Dictaphone:", e);
        return error(e.message, 500);
    }
}
