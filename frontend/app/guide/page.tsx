'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GuidePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    toursToday: 0,
    visitors: 0,
    artifacts: 0,
    galleries: 0
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and is a guide
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(savedUser);
    if (userData.role !== 'guide') {
      router.push('/');
      return;
    }

    setUser(userData);

    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch Stats
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Personal Stats: Tours Today 
        // First get staff ID
        const staffRes = await fetch(`http://localhost:8000/api/staff?email=${userData.email}`, { signal });
        if (!staffRes.ok) throw new Error('Failed to fetch staff info');
        
        const staffData = await staffRes.json();
        let toursCount = 0;

        if (Array.isArray(staffData) && staffData.length > 0) {
          const staffId = staffData[0].staff_id;
          const toursRes = await fetch(`http://localhost:8000/api/tours?guide_id=${staffId}&date=${today}`, { signal });
           // If tours fetch fails, we can treat it as 0 or throw. Let's inspect.
          if (toursRes.ok) {
              const toursData = await toursRes.json();
              if (Array.isArray(toursData)) toursCount = toursData.length;
          }
        }

        // 2. Global Stats
        const [visRes, artRes, galRes] = await Promise.all([
          fetch('http://localhost:8000/api/visitors', { signal }),
          fetch('http://localhost:8000/api/artifacts', { signal }),
          fetch('http://localhost:8000/api/galleries', { signal })
        ]);

        const visitors = visRes.ok ? await visRes.json() : [];
        const artifacts = artRes.ok ? await artRes.json() : [];
        const galleries = galRes.ok ? await galRes.json() : [];

        setStats({
          toursToday: toursCount,
          visitors: Array.isArray(visitors) ? visitors.length : 0,
          artifacts: Array.isArray(artifacts) ? artifacts.length : 0,
          galleries: Array.isArray(galleries) ? galleries.length : 0
        });

      } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Error loading stats:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
        controller.abort();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white">
      {/* Navigation */}
      <nav className="bg-green-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">👨‍🏫 Guide Dashboard</h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-green-100">Welcome, {user.name}!</span>}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold mb-4">Welcome, Guide!</h2>
        <p className="text-green-100 text-lg mb-12">
          Choose an option below to get started with your museum tour management tasks.
        </p>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
          {/* Scheduled Tours */}
          <div className="bg-green-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold mb-4">Scheduled Tours</h3>
            <p className="text-green-100 mb-6">
              View and manage your upcoming guided tours. Check visitor lists and tour schedules.
            </p>
            <Link href="/guide/tours">
              <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
                View Tours
              </button>
            </Link>
          </div>

          {/* Museum Floor Plan */}
          <div className="bg-green-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold mb-4">Museum Floor Plan</h3>
            <p className="text-green-100 mb-6">
              View the museum layout and navigate through different galleries and exhibition areas.
            </p>
            <Link href="/guide/map">
              <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
                View Floor Plan
              </button>
            </Link>
          </div>

          {/* Artifact Information */}
          <div className="bg-green-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 md:col-span-2">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-2xl font-bold mb-4">Artifact Information</h3>
            <p className="text-green-100 mb-6">
              Explore detailed information about museum artifacts, including audio guides, history, and gallery locations.
            </p>
            <Link href="/guide/artifacts">
              <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
                View Artifacts
              </button>
            </Link>
          </div>


        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-green-700 p-8 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-6">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">{stats.toursToday}</div>
              <p className="text-green-100 mt-2">Your Tours Today</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">{stats.visitors}</div>
              <p className="text-green-100 mt-2">Total Visitors</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">{stats.artifacts}</div>
              <p className="text-green-100 mt-2">Total Artifacts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">{stats.galleries}</div>
              <p className="text-green-100 mt-2">Total Galleries</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
