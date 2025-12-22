'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginRole, setLoginRole] = useState('guide');
  const [signupRole, setSignupRole] = useState('guide');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white">
      {/* Navigation */}
      <nav className="bg-blue-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">🏛️ Grand Museum</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">Welcome to the Grand Museum</h2>
          <p className="text-xl text-blue-100 mb-8">
            Discover the world's most fascinating artifacts and historical treasures
          </p>
        </div>

        {/* Museum Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-blue-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-bold mb-4">📚 History</h3>
            <p className="text-blue-100">
              Founded in 1850, our museum houses over 50,000 artifacts spanning 5,000 years of human civilization.
            </p>
          </div>
          <div className="bg-blue-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-bold mb-4">🎨 Collections</h3>
            <p className="text-blue-100">
              From ancient Egyptian mummies to Renaissance paintings, explore diverse collections from around the world.
            </p>
          </div>
          <div className="bg-blue-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-bold mb-4">👥 Visitors</h3>
            <p className="text-blue-100">
              Over 2 million visitors annually experience our world-class exhibitions and guided tours.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-lg text-blue-100 mb-8">Ready to explore? Please log in or sign up to continue.</p>
          <div className="flex gap-6 justify-center flex-wrap">
            <button
              onClick={() => {
          setShowLogin(true);
          setShowSignup(false);
              }}
              className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition text-lg cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => {
          setShowSignup(true);
          setShowLogin(false);
              }}
              className="px-8 py-4 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition text-lg cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Login Form */}
        {showLogin && (
          <div className="mt-12 max-w-md mx-auto bg-blue-700 p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6">Login</h3>
            <div className="mb-4">
              <label className="block text-blue-100 mb-2">Role</label>
              <select
          value={loginRole}
          onChange={(e) => setLoginRole(e.target.value)}
          className="w-full px-4 py-2 rounded bg-blue-600 text-white border border-blue-500"
              >
          <option value="guide">Guide</option>
          <option value="admin">Admin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-blue-100 mb-2">Email</label>
              <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-2 rounded bg-blue-600 text-white placeholder-blue-300"
              />
            </div>
            <div className="mb-6">
              <label className="block text-blue-100 mb-2">Password</label>
              <input
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-2 rounded bg-blue-600 text-white placeholder-blue-300"
              />
            </div>
            {loginRole === 'guide' ? (
              <Link href="/guide">
          <button className="w-full px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition">
            Login as Guide
          </button>
              </Link>
            ) : (
              <Link href="/admin">
          <button className="w-full px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition">
            Login as Admin
          </button>
              </Link>
            )}
          </div>
        )}

        {/* Sign Up Form */}
        {showSignup && (
          <div className="mt-12 max-w-md mx-auto bg-blue-700 p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6">Sign Up</h3>
            <div className="mb-4">
              <label className="block text-blue-100 mb-2">Role</label>
              <select
          value={signupRole}
          onChange={(e) => setSignupRole(e.target.value)}
          className="w-full px-4 py-2 rounded bg-blue-600 text-white border border-blue-500"
              >
          <option value="guide">Guide</option>
          <option value="admin">Admin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-blue-100 mb-2">Full Name</label>
              <input
          type="text"
          placeholder="Enter your full name"
          className="w-full px-4 py-2 rounded bg-blue-600 text-white placeholder-blue-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-blue-100 mb-2">Email</label>
              <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-2 rounded bg-blue-600 text-white placeholder-blue-300"
              />
            </div>
            <div className="mb-6">
              <label className="block text-blue-100 mb-2">Password</label>
              <input
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-2 rounded bg-blue-600 text-white placeholder-blue-300"
              />
            </div>
            {signupRole === 'guide' ? (
              <Link href="/guide">
          <button className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition">
            Sign Up as Guide
          </button>
              </Link>
            ) : (
              <Link href="/admin">
          <button className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition">
            Sign Up as Admin
          </button>
              </Link>
            )}
          </div>
        )}
            </main>
          </div>
        );
      }
