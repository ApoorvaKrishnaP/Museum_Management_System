'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GuideToursPage() {
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedTourId, setExpandedTourId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchMyTours = async () => {
            try {
                // Check authentication
                const savedUser = localStorage.getItem('user');
                if (!savedUser) {
                    if (isMounted) router.push('/');
                    return;
                }

                const user = JSON.parse(savedUser);

                // Validate user object
                if (!user.email) {
                    if (isMounted) {
                        setError('User email not found. Please log in again.');
                        setLoading(false);
                    }
                    return;
                }

                // Fetch tours
                const toursRes = await fetch(
                    `http://localhost:8000/api/tours/guide-view?email=${encodeURIComponent(user.email)}`,
                    { signal: controller.signal }
                );

                if (!toursRes.ok) {
                    throw new Error(`Server error: ${toursRes.status}`);
                }

                const toursData = await toursRes.json();

                if (isMounted) {
                    setTours(Array.isArray(toursData) ? toursData : []);
                    setError(null);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Error loading tours:', err);
                    if (isMounted) {
                        setError(err.message || 'Failed to load tours');
                        setTours([]);
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMyTours();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []); // Empty array - runs ONLY on mount

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-300 border-t-white mx-auto mb-6"></div>
                    <p className="text-lg font-semibold">Loading your scheduled tours...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white flex items-center justify-center">
                <div className="text-center bg-red-500/20 border border-red-500 rounded-lg p-8 max-w-md">
                    <p className="text-xl font-bold mb-4">❌ Error</p>
                    <p className="text-red-200 mb-6">{error}</p>
                    <Link href="/guide">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white font-sans">
            {/* Navigation */}
            <nav className="bg-green-950 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">📅 Your Scheduled Tours</h1>
                    <Link href="/guide">
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 transition rounded font-bold text-sm">
                            ← Back to Dashboard
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {tours.length === 0 ? (
                    <div className="bg-green-800/50 backdrop-blur-sm rounded-xl border border-green-700 p-12 text-center shadow-2xl">
                        <p className="text-xl text-green-200">No scheduled tours at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tours.map((tour) => (
                            <div key={tour.tour_id} className="bg-green-800/40 backdrop-blur-sm rounded-xl border border-green-700 shadow-2xl overflow-hidden hover:shadow-xl transition">
                                {/* Tour Header - Main Info */}
                                <div className="p-6 bg-green-900/30 border-b border-green-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-4">{tour.visitor_group_name}</h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-green-300 text-xs uppercase font-bold tracking-wide">📅 Date</p>
                                                    <p className="text-white font-semibold text-lg">{tour.tour_date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-green-300 text-xs uppercase font-bold tracking-wide">⏰ Time</p>
                                                    <p className="text-yellow-300 font-mono font-bold text-lg">{tour.tour_time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-green-300 text-xs uppercase font-bold tracking-wide">👥 Group Size</p>
                                                    <p className="text-white font-semibold text-lg">{tour.group_size}</p>
                                                </div>
                                                <div>
                                                    <p className="text-green-300 text-xs uppercase font-bold tracking-wide">🗣️ Language</p>
                                                    <p className="text-white font-semibold text-lg">{tour.language}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="ml-4">
                                            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest inline-block
                                                ${tour.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' :
                                                    tour.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                                                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'}`}>
                                                {tour.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expand/Collapse Button */}
                                <div className="px-6 py-3 bg-green-800/20 border-t border-green-700">
                                    <button
                                        onClick={() => setExpandedTourId(expandedTourId === tour.tour_id ? null : tour.tour_id)}
                                        className="w-full flex items-center justify-between text-green-300 hover:text-green-200 transition font-semibold text-lg"
                                    >
                                        <span>
                                            👥 View Assigned Visitors ({tour.visitors?.length || 0})
                                        </span>
                                        <span className={`transform transition-transform duration-300 ${expandedTourId === tour.tour_id ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </button>
                                </div>

                                {/* Visitor Details Section - Expandable */}
                                {expandedTourId === tour.tour_id && (
                                    <div className="px-6 py-6 bg-green-900/20 border-t border-green-700">
                                        {tour.visitors && tour.visitors.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {tour.visitors.map((visitor: any) => (
                                                    <div 
                                                        key={visitor.visitor_id} 
                                                        className="bg-green-800/50 border border-green-600 rounded-lg p-4 hover:bg-green-800/70 transition transform hover:scale-105 duration-200"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Avatar */}
                                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white shadow-lg">
                                                                {visitor.name.charAt(0).toUpperCase()}
                                                            </div>

                                                            {/* Visitor Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-white font-bold text-base mb-2">
                                                                    #{visitor.visitor_id} - {visitor.name}
                                                                </h3>
                                                                <div className="space-y-1 text-sm">
                                                                    <p className="text-green-200 flex items-center gap-2">
                                                                        <span className="font-semibold">🌍</span>
                                                                        <span>{visitor.nationality}</span>
                                                                    </p>
                                                                    <p className="text-green-200 flex items-center gap-2">
                                                                        <span className="font-semibold">🗣️</span>
                                                                        <span>{visitor.preferred_language}</span>
                                                                    </p>
                                                                    <p className="text-green-200 flex items-center gap-2 break-all">
                                                                        <span className="font-semibold flex-shrink-0">📞</span>
                                                                        <span className="font-mono">{visitor.contact}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-green-400 text-center py-6 text-lg">No visitors assigned to this tour yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}