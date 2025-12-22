'use client';

import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white">
      {/* Navigation */}
      <nav className="bg-green-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">👨‍🏫 Guide Dashboard</h1>
          <Link href="/">
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded">
              Logout
            </button>
          </Link>
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
            <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
              View Tours
            </button>
          </div>

          {/* Artifact Info */}
          <div className="bg-green-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-2xl font-bold mb-4">Artifact Information</h3>
            <p className="text-green-100 mb-6">
              Access detailed information about museum artifacts. Learn historical facts and descriptions.
            </p>
            <Link href="/guide/artefact">
              <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
                Browse Artifacts
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
            <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
              View Floor Plan
            </button>
          </div>

          {/* Gallery Overview */}
          <div className="bg-green-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold mb-4">Gallery Overview</h3>
            <p className="text-green-100 mb-6">
              Get an overview of all galleries and current exhibitions in the museum.
            </p>
            <button className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition">
              Explore Galleries
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-green-700 p-8 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-6">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">12</div>
              <p className="text-green-100 mt-2">Tours Today</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">156</div>
              <p className="text-green-100 mt-2">Visitors</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">48</div>
              <p className="text-green-100 mt-2">Artifacts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300">5</div>
              <p className="text-green-100 mt-2">Galleries</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
