'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Artifact {
    artifact_id: number;
    name: string;
    description: string;
    gallery_name: string;
    historical_period: string;
    category: string;
    image_url: string | null;
    audio_url: string | null;
}

export default function VisitorDashboard() {
    const router = useRouter();
    const [visitor, setVisitor] = useState<any>(null);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [selectedForFeedback, setSelectedForFeedback] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Check if visitor is logged in
        const savedVisitor = localStorage.getItem('visitor_user');
        if (!savedVisitor) {
            // Fallback to checking 'user' if logged in via main login
            const mainUser = localStorage.getItem('user');
            if (mainUser) {
                const u = JSON.parse(mainUser);
                if (u.role === 'visitor') {
                    setVisitor(u);
                } else {
                    router.push('/');
                    return;
                }
            } else {
                router.push('/');
                return;
            }
        } else {
            setVisitor(JSON.parse(savedVisitor));
        }

        // Fetch artifacts
        fetch('http://localhost:8000/api/artifacts/enriched')
            .then(res => res.json())
            .then(data => {
                setArtifacts(data);
            })
            .catch(err => console.error("Failed to fetch artifacts", err))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('visitor_user');
        localStorage.removeItem('user');
        router.push('/');
    };

    const toggleArtifactForFeedback = (id: number) => {
        setSelectedForFeedback(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;

        setSubmitting(true);
        try {
            // Append selected artifacts to feedback
            const selectedNames = artifacts
                .filter(a => selectedForFeedback.includes(a.artifact_id))
                .map(a => a.name)
                .join(', ');

            const finalFeedback = feedbackText + (selectedNames ? `\n\n[Visited Artifacts: ${selectedNames}]` : '');

            const res = await fetch('http://localhost:8000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_id: String(visitor?.visitor_id || 'guest'),
                    feedback_text: finalFeedback,
                    rating: rating
                })
            });

            if (res.ok) {
                alert("Thank you for your feedback!");
                setFeedbackText('');
                setRating(5);
                setSelectedForFeedback([]);
            } else {
                alert("Failed to submit feedback.");
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredArtifacts = artifacts.filter(artifact =>
        artifact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.historical_period?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.gallery_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-xl font-bold text-neutral-400">Loading your immersive experience...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans selection:bg-amber-500/30">
            {/* Navbar */}
            <nav className="bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        🏛️ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Visitor Portal</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-neutral-400 font-medium">Hello, <span className="text-white">{visitor?.name}</span></span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition duration-200 border border-white/5"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* Welcome Section */}
                <section className="mb-16 text-center">
                    <h2 className="text-5xl font-bold text-white mb-6 tracking-tight">Explore History</h2>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Select artifacts you've visited to curate your personal journey and provide feedback.
                    </p>
                </section>

                {/* Search & Filter */}
                <div className="mb-12 flex justify-center">
                    <div className="relative w-full max-w-xl">
                        <input
                            type="text"
                            placeholder="Search artifacts, galleries, or eras..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#141414] border border-white/5 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder-neutral-600 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="absolute left-4 top-4 text-neutral-500 text-lg">🔍</span>
                    </div>
                </div>

                {/* Artifacts Gallery */}
                <section className="mb-24 flex flex-col gap-8">
                    {filteredArtifacts.length > 0 ? (
                        filteredArtifacts.map((artifact) => (
                            <div
                                key={artifact.artifact_id}
                                className={`group relative flex flex-col lg:flex-row bg-[#141414] rounded-2xl overflow-hidden border transition-all duration-300 ${selectedForFeedback.includes(artifact.artifact_id)
                                    ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                    : 'border-white/5 hover:border-white/20'
                                    }`}
                            >
                                {/* Image Section */}
                                <div className="lg:w-1/3 relative h-72 lg:h-auto bg-[#1a1a1a]">
                                    {artifact.image_url ? (
                                        <img
                                            src={artifact.image_url}
                                            alt={artifact.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                            No Image Available
                                        </div>
                                    )}

                                    {/* Gallery Badge */}
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-black/80 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                                            <span className="text-rose-500 text-lg">📍</span>
                                            <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">
                                                {artifact.gallery_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="lg:w-2/3 p-8 lg:p-10 flex flex-col justify-between">
                                    <div className="flex-1">
                                        {/* Header Row: Title and Select Button */}
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-3xl font-bold text-white tracking-tight">{artifact.name}</h2>

                                            {/* Select Button in Header */}
                                            <button
                                                onClick={() => toggleArtifactForFeedback(artifact.artifact_id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all uppercase text-xs font-bold tracking-wider ${selectedForFeedback.includes(artifact.artifact_id)
                                                    ? 'bg-amber-500 text-black border-amber-500 hover:bg-amber-400'
                                                    : 'bg-transparent text-neutral-400 border-white/20 hover:border-white/50 hover:text-white'
                                                    }`}
                                            >
                                                {selectedForFeedback.includes(artifact.artifact_id) ? (
                                                    <>
                                                        <span>✓</span>
                                                        <span>Selected</span>
                                                    </>
                                                ) : (
                                                    <span>Select Artifact</span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-3 mb-6">
                                            <span className="px-3 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                {artifact.category}
                                            </span>
                                            <span className="px-3 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                {artifact.historical_period}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-neutral-400 leading-relaxed text-lg mb-8">
                                            {artifact.description}
                                        </p>
                                    </div>

                                    {/* Audio Player at Bottom */}
                                    {artifact.audio_url && (
                                        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-4 mt-auto">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                                                🎧
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-neutral-500 uppercase mb-1 tracking-widest">Audio Guide</p>
                                                <audio controls className="w-full h-8 block custom-audio-dark">
                                                    <source src={artifact.audio_url} type="audio/mpeg" />
                                                </audio>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
                            <p className="text-neutral-500 text-xl">No artifacts found matching "{searchQuery}"</p>
                        </div>
                    )}
                </section>

                {/* Feedback Section */}
                <section className="max-w-4xl mx-auto">
                    <div className="bg-[#141414] p-8 lg:p-12 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                        {/* Decorative gradient blob */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <h3 className="text-3xl font-bold text-white mb-2 relative z-10">
                            Share Your Experience
                        </h3>
                        <p className="text-neutral-400 mb-8 relative z-10">
                            Help us improve by rating your visit and the artifacts you explored.
                        </p>


                        {selectedForFeedback.length > 0 && (
                            <div className="mb-8 p-6 bg-[#0a0a0a] rounded-2xl border border-white/5">
                                <h4 className="font-bold text-amber-500 mb-4 text-xs uppercase tracking-widest">Selected Artifacts</h4>
                                <div className="flex flex-wrap gap-2">
                                    {artifacts.filter(a => selectedForFeedback.includes(a.artifact_id)).map(a => (
                                        <span key={a.artifact_id} className="group pl-3 pr-2 py-1.5 bg-[#1a1a1a] text-neutral-300 rounded-full text-sm border border-white/10 flex items-center gap-2 hover:border-red-500/50 transition-colors">
                                            {a.name}
                                            <button
                                                onClick={() => toggleArtifactForFeedback(a.artifact_id)}
                                                className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-500 group-hover:bg-red-500 group-hover:text-white transition-all"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={submitFeedback} className="space-y-6 relative z-10">
                            <div>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-[#0a0a0a] border border-white/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-neutral-600 outline-none transition-all resize-none"
                                    rows={5}
                                    placeholder="What did you think of the galleries? Which artifact was your favorite?"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex gap-2 bg-[#0a0a0a] p-2 rounded-xl border border-white/5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg transition-all ${rating >= star ? 'text-amber-400 bg-amber-400/10' : 'text-neutral-700 hover:text-neutral-500'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

            </main>

            <footer className="bg-[#0a0a0a] border-t border-white/5 text-neutral-500 py-12 text-center">
                <p>© 2024 Grand Museum. Preserving the Past, Inspiring the Future.</p>
            </footer>

            <style jsx global>{`
                audio::-webkit-media-controls-panel {
                    background-color: #262626;
                }
                audio::-webkit-media-controls-current-time-display,
                audio::-webkit-media-controls-time-remaining-display {
                    color: #fff;
                }
            `}</style>
        </div>
    );
}