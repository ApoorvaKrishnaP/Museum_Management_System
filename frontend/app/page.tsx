'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignupForm } from './components/SignupForm';
import { LoginForm } from './components/LoginForm';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSignupSuccess = (userData: any) => {
    setUser(userData);
    redirectUser(userData);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    redirectUser(userData);
  };

  const redirectUser = (userData: any) => {
    if (userData.role === 'admin') {
      router.push('/admin');
    } else if (userData.role === 'visitor') {
      router.push('/visitor');
    } else {
      router.push('/guide');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('visitor_user');
    setShowLogin(false);
    setShowSignup(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-900 to-blue-800 text-white">
            {/* Navigation with Logo */}
      <nav className="bg-blue-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          {/* Left Side: Title + Logo */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start">
              <h1 className="text-3xl font-bold">🏛️ Grand Museum</h1>
              {/* Logo below text */}
              <img 
                src="/RVCE_LOGOpng.png" 
                alt="RVCE Logo" 
                className="h-12 mt-2 object-contain"
              />
            </div>
          </div>

          {/* Right Side: User Info & Logout */}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-blue-100">Welcome, {user.name}! ({user.role})</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded"
              >
                Logout
              </button>
            </div>
          )}
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
        {!user && (
          <div className="text-center">
            <p className="text-lg text-blue-100 mb-8">Ready to explore? Please log in or sign up to continue.</p>
            <div className="flex gap-6 justify-center flex-wrap">
              <button
                onClick={() => { setShowLogin(true); setShowSignup(false); }}
                className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition text-lg cursor-pointer shadow-lg"
              >
                Login
              </button>
              <button
                onClick={() => { setShowSignup(true); setShowLogin(false); }}
                className="px-8 py-4 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition text-lg cursor-pointer shadow-lg"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* User Logged In Section */}
        {user && (
          <div className="text-center">
            <p className="text-lg text-blue-100 mb-8">Choose your next destination:</p>
            <div className="flex gap-6 justify-center flex-wrap">
              {user.role === 'guide' && (
                <Link href="/guide">
                  <button className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition text-lg">
                    Go to Guide Dashboard
                  </button>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin">
                  <button className="px-8 py-4 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition text-lg">
                    Go to Admin Dashboard
                  </button>
                </Link>
              )}
              {user.role === 'visitor' && (
                <Link href="/visitor">
                  <button className="px-8 py-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition text-lg">
                    Go to Visitor Dashboard
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Modal Backdrop for Login */}
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-600 text-2xl hover:text-gray-800"
              >
                ×
              </button>
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onClose={() => setShowLogin(false)}
              />
            </div>
          </div>
        )}

        {/* Modal Backdrop for Signup */}
        {showSignup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative">
              <button
                onClick={() => setShowSignup(false)}
                className="absolute top-4 right-4 text-gray-600 text-2xl hover:text-gray-800"
              >
                ×
              </button>
              <SignupForm
                onSignupSuccess={handleSignupSuccess}
                onClose={() => setShowSignup(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}