'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock Data for Scheduled Tours
const MOCK_TOURS = [
    { id: 1, date: '2023-10-27', time: '10:00 AM', visitor_group: 'School Group A', group_size: 25, language: 'English', status: 'Scheduled', visitor_id: 1024 },
    { id: 2, date: '2023-10-27', time: '02:00 PM', visitor_group: 'Smith Family', group_size: 5, language: 'Spanish', status: 'Scheduled', visitor_id: 1056 },
    { id: 3, date: '2023-10-28', time: '11:00 AM', visitor_group: 'City Tourists', group_size: 15, language: 'French', status: 'Pending', visitor_id: 1089 },
    { id: 4, date: '2023-10-26', time: '09:00 AM', visitor_group: 'History Club', group_size: 10, language: 'English', status: 'Completed', visitor_id: 1011 },
];

export default function GuideToursPage() {
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
    const fetchMyTours = async () => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            router.push('/');
            return;
        }
        const user = JSON.parse(savedUser);

        try {
            // Directly fetch tours by guide email - single API call!
            const toursRes = await fetch(`http://localhost:8000/api/tours/by-guide-email?email=${user.email}`);
            
            if (!toursRes.ok) {
                throw new Error('Failed to fetch tours');
            }
            
            const toursData = await toursRes.json();
            setTours(toursData);
        } catch (error) {
            console.error("Error loading tours:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchMyTours();
}, []); // ✅ CHANGED: Empty dependency array

    if (loading) return <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">Loading your schedule...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white font-sans">
            <nav className="bg-green-950 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">📅 Scheduled Tours</h1>
                    <Link href="/guide">
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 transition rounded font-bold text-sm">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="bg-green-800/50 backdrop-blur-sm rounded-xl border border-green-700 p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold mb-6">Upcoming & Past Tours</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-green-200 border-b border-green-600">
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Group / Visitor</th>
                                    <th className="py-3 px-4">Size</th>
                                    <th className="py-3 px-4">Language</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Visitor IDs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tours.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-green-300">No scheduled tours found.</td></tr>
                                ) : (
                                    tours.map((tour) => (
                                        <tr key={tour.tour_id} className="hover:bg-green-700/50 transition border-b border-green-700/50 last:border-0">
                                            <td className="py-4 px-4">{tour.tour_date}</td>
                                            <td className="py-4 px-4 font-mono text-yellow-300">{tour.tour_time}</td>
                                            <td className="py-4 px-4 font-semibold">{tour.visitor_group_name}</td>
                                            <td className="py-4 px-4">{tour.group_size}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-2 py-1 bg-green-900 rounded text-xs border border-green-600">
                                                    {tour.language}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                        ${tour.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' :
                                                        tour.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                                                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'}`}>
                                                    {tour.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-green-200">
                                                {Array.isArray(tour.visitor_ids) ? tour.visitor_ids.join(', ') : tour.visitor_ids}
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
