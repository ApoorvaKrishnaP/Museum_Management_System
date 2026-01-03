'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Artifact {
    artifact_id: number;
    name: string;
    gallery_name: string;
    historical_period: string;
    category: string;
    material: string;
    condition_status: string;
    description: string;
    image_url: string | null;
    audio_url: string | null;
}

export default function ArtifactsPage() {
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchArtifacts = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/artifacts/enriched');
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setArtifacts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchArtifacts();
    }, []);

    if (loading) return <div className="text-center p-10 text-white">Loading Artifacts...</div>;

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans">
            {/* Navbar */}
            <nav className="bg-neutral-800 border-b border-neutral-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/guide" className="text-gray-400 hover:text-white transition">
                            &larr; Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-amber-500">🏛️ Artifact Information</h1>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 gap-12">
                    {artifacts.map((artifact) => (
                        <div
                            key={artifact.artifact_id}
                            className="bg-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-neutral-700 hover:border-amber-500/50 transition duration-300"
                        >
                            {/* Image Section - Locked to Left on large screens */}
                            <div className="lg:w-1/3 relative h-64 lg:h-auto bg-black flex-shrink-0">
                                {artifact.image_url ? (
                                    <img
                                        src={artifact.image_url}
                                        alt={artifact.name}
                                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        No Image Available
                                    </div>
                                )}
                                {/* Gallery Badge */}
                                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                        📍 {artifact.gallery_name}
                                    </span>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="lg:w-2/3 p-8 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-3xl font-bold text-white mb-2">{artifact.name}</h2>
                                    </div>

                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        {artifact.description}
                                    </p>
                                </div>

                                {/* Audio Player */}
                                {artifact.audio_url && (
                                    <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700/50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-amber-500 text-lg">🎧</span>
                                            <span className="text-sm font-medium text-gray-300">Audio Guide</span>
                                        </div>
                                        <audio controls className="w-full h-8 accent-amber-500">
                                            <source src={artifact.audio_url} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {artifacts.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                            No enriched artifact data found. Ensure 'artefact_media' table has data.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
