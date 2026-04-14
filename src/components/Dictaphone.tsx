"use client";
import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, FileAudio, Upload } from 'lucide-react';

export default function Dictaphone({ userId }: { userId: string }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioChunks(chunks);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTranscription(null);
        } catch (err) {
            console.error("Erreur micro:", err);
            alert("Accès au microphone refusé ou indisponible.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    };

    const handleTranscribe = async () => {
        if (audioChunks.length === 0) return;
        setIsTranscribing(true);
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'temoignage.webm');
        formData.append('userId', userId);

        try {
            const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.text) {
                setTranscription(data.text);
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="bg-white border text-center border-orange-200 hover:border-orange-400 rounded-3xl p-6 shadow-sm transition-all overflow-hidden relative">
            <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Mic className="w-5 h-5 text-[#FF6600]" /> Témoignage Oral (IA)
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Racontez l'histoire d'un ancêtre ou d'une lignée. L'IA de Racines+ la convertira automatiquement en texte pour les archives.
            </p>
            
            {!isRecording && !audioUrl && (
                <button onClick={startRecording} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-3 px-6 rounded-2xl font-bold flex flex-col items-center justify-center w-full transition-all">
                    <Mic className="w-8 h-8 mb-2" />
                    Commencer l'enregistrement
                </button>
            )}

            {isRecording && (
                <button onClick={stopRecording} className="bg-red-500 text-white border border-red-600 hover:bg-red-600 py-3 px-6 rounded-2xl font-bold flex flex-col items-center justify-center w-full transition-all animate-pulse">
                    <Square className="w-8 h-8 mb-2" />
                    Arrêter (Enregistrement en cours...)
                </button>
            )}

            {audioUrl && !isRecording && (
                <div className="flex flex-col items-center w-full gap-4">
                    <audio src={audioUrl} controls className="w-full" />
                    <div className="flex gap-3 w-full">
                        <button onClick={() => { setAudioUrl(null); setTranscription(null); }} className="flex-1 py-2 px-4 rounded-xl font-bold text-gray-600 bg-gray-50 border border-gray-200">
                            Recommencer
                        </button>
                        <button onClick={handleTranscribe} disabled={isTranscribing} className="flex-[2] bg-[#FF6600] text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                            {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileAudio className="w-4 h-4" />}
                            {isTranscribing ? "Transcription..." : "Transcrire avec l'IA"}
                        </button>
                    </div>
                </div>
            )}

            {transcription && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left text-sm text-gray-800 italic">
                    "{transcription}"
                    <button onClick={() => alert('Sauvegardé avec succès !')} className="mt-3 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3" /> Associer comme Archive Officielle
                    </button>
                </div>
            )}
        </div>
    );
}
