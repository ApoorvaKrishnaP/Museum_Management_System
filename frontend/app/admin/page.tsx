'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    visitDate: '',
    category: 'student',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Visitor data submitted:', formData);
    alert('Visitor details saved successfully!');
    setFormData({
      name: '',
      age: '',
      email: '',
      visitDate: '',
      category: 'student',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Navigation */}
      <nav className="bg-purple-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">⚙️ Admin Dashboard</h1>
          <Link href="/">
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded">
              Logout
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold mb-12">Museum Management Dashboard</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visitor Form */}
          <div className="lg:col-span-1 bg-purple-700 p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6">Add Visitor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-100 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter visitor name"
                  className="w-full px-4 py-2 rounded bg-purple-600 text-white placeholder-purple-300 border border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-100 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter age"
                  className="w-full px-4 py-2 rounded bg-purple-600 text-white placeholder-purple-300 border border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-100 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="w-full px-4 py-2 rounded bg-purple-600 text-white placeholder-purple-300 border border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-100 mb-2">Visit Date</label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-purple-600 text-white placeholder-purple-300 border border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-100 mb-2">Visitor Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded bg-purple-600 text-white border border-purple-500 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                  <option value="group">Group</option>
                  <option value="family">Family</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition mt-6"
              >
                Add Visitor
              </button>
            </form>
          </div>

          {/* Analytics and Graphs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
                <div className="text-4xl font-bold text-yellow-300">2,847</div>
                <p className="text-purple-100 mt-2 text-sm">Total Visitors</p>
              </div>
              <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
                <div className="text-4xl font-bold text-cyan-300">156</div>
                <p className="text-purple-100 mt-2 text-sm">Today's Visitors</p>
              </div>
              <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
                <div className="text-4xl font-bold text-pink-300">48</div>
                <p className="text-purple-100 mt-2 text-sm">Total Artifacts</p>
              </div>
              <div className="bg-purple-700 p-6 rounded-lg shadow-lg text-center">
                <div className="text-4xl font-bold text-lime-300">5</div>
                <p className="text-purple-100 mt-2 text-sm">Active Galleries</p>
              </div>
            </div>

            {/* Dummy Graph 1: Visitor Count by Category */}
            <div className="bg-purple-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Visitors by Category</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-purple-100">Students</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <div className="w-full bg-purple-600 rounded-full h-8 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-purple-100">Adults</span>
                    <span className="font-bold">40%</span>
                  </div>
                  <div className="w-full bg-purple-600 rounded-full h-8 overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-purple-100">Groups</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <div className="w-full bg-purple-600 rounded-full h-8 overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-purple-100">Seniors</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <div className="w-full bg-purple-600 rounded-full h-8 overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dummy Graph 2: Monthly Visitor Trend */}
            <div className="bg-purple-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Monthly Visitor Trend</h3>
              <div className="flex items-end justify-between h-64 gap-2">
                {[
                  { month: 'Jan', value: 45 },
                  { month: 'Feb', value: 52 },
                  { month: 'Mar', value: 48 },
                  { month: 'Apr', value: 61 },
                  { month: 'May', value: 55 },
                  { month: 'Jun', value: 67 },
                  { month: 'Jul', value: 72 },
                  { month: 'Aug', value: 68 },
                  { month: 'Sep', value: 59 },
                  { month: 'Oct', value: 73 },
                  { month: 'Nov', value: 65 },
                  { month: 'Dec', value: 78 },
                ].map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                      style={{ height: `${(item.value / 100) * 100}%` }}
                    ></div>
                    <span className="text-purple-100 text-sm mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dummy Graph 3: Gallery Popularity */}
            <div className="bg-purple-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Gallery Popularity</h3>
              <div className="space-y-4">
                {[
                  { gallery: 'Ancient Egypt', visitors: 320 },
                  { gallery: 'Medieval Europe', visitors: 280 },
                  { gallery: 'Asian Heritage', visitors: 250 },
                  { gallery: 'Modern Art', visitors: 310 },
                  { gallery: 'Natural History', visitors: 290 },
                ].map((item) => (
                  <div key={item.gallery}>
                    <div className="flex justify-between mb-2">
                      <span className="text-purple-100">{item.gallery}</span>
                      <span className="font-bold">{item.visitors} visitors</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full"
                        style={{ width: `${(item.visitors / 320) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
