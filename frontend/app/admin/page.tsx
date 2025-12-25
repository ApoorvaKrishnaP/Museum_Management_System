'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock Lists for Dropdowns
const COUNTRIES = ["India", "USA", "UK", "France", "Germany", "Japan", "China", "Australia", "Canada", "Other"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Mandarin", "Other"];
const TICKET_TYPES = ["Standard", "VIP", "Student"];

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    nationality: 'India',
    preferred_language: 'English',
    last_visit_date: '',
    ticket_type: 'Standard',
    id_proof: 'Voter ID',
    contact: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});



  const [activeTab, setActiveTab] = useState<'visitor' | 'staff' | 'finance'>('visitor');

  // Staff State
  const [staffData, setStaffData] = useState({
    name: '', occupation: 'Tour_guide', contact: '', joining_date: '', email: ''
  });
  const [staffErrors, setStaffErrors] = useState<{ [key: string]: string }>({});

  // Finance State
  const [financeData, setFinanceData] = useState({
    visitor_id: '',
    ticket_type: 'Standard',
    amount: '',
    payment_method: 'Card',
    discount_applied: false,
    counter_id: 'C1'
  });
  const [financeErrors, setFinanceErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Check if user is logged in and is an admin
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(savedUser);
    if (userData.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name: Trim, Min length 2
    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    // Age: Numeric
    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      newErrors.age = "Please enter a valid age (1-120).";
    }

    // Email: Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    // Last Visit Date: Not future
    if (formData.last_visit_date) {
      const selectedDate = new Date(formData.last_visit_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Clear time for comparison
      if (selectedDate > today) {
        newErrors.last_visit_date = "Date cannot be in the future.";
      }
    }

    // Contact: Regex (simple digits check)
    const contactRegex = /^\+?[0-9]{7,15}$/;
    if (!contactRegex.test(formData.contact)) {
      newErrors.contact = "Invalid contact number (7-15 digits).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // calculateAgeGroup function removed as per request

  // --- STAFF HANDLERS ---
  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStaffData((prev) => ({ ...prev, [name]: value }));
    if (staffErrors[name]) setStaffErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateStaffForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (staffData.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffData.email)) newErrors.email = "Invalid email format.";
    if (!/^\+?[0-9]{10,15}$/.test(staffData.contact)) newErrors.contact = "Invalid contact number (10-15 digits).";
    if (staffData.joining_date) {
      const selectedDate = new Date(staffData.joining_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) newErrors.joining_date = "Joining Date cannot be in the future.";
    } else {
      newErrors.joining_date = "Joining Date is required.";
    }
    setStaffErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStaffForm()) return;

    try {
      const payload = {
        ...staffData,
        name: staffData.name.trim(),
        email: staffData.email.toLowerCase(),
      };

      const res = await fetch('http://localhost:8000/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Staff registered successfully!');
        setStaffData({ name: '', occupation: 'Tour_guide', contact: '', joining_date: '', email: '' });
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to connect to server.");
    }
  };

  // --- FINANCE HANDLERS ---
  const handleFinanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFinanceData(prev => ({ ...prev, [name]: val }));
    if (financeErrors[name]) setFinanceErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateFinanceForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!financeData.visitor_id || isNaN(Number(financeData.visitor_id))) newErrors.visitor_id = "Valid Visitor ID required.";
    if (!financeData.amount || Number(financeData.amount) <= 0) newErrors.amount = "Amount must be positive.";
    if (!financeData.counter_id.startsWith('C')) newErrors.counter_id = "Counter ID must start with 'C'.";

    setFinanceErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFinanceForm()) return;

    try {
      const payload = {
        ...financeData,
        visitor_id: Number(financeData.visitor_id),
        amount: Number(financeData.amount)
      };

      const res = await fetch('http://localhost:8000/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Transaction recorded successfully!');
        setFinanceData({
          visitor_id: '',
          ticket_type: 'Standard',
          amount: '',
          payment_method: 'Card',
          discount_applied: false,
          counter_id: 'C1'
        });
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to connect to server.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.toLowerCase(),
        age_group: formData.age, // Send exact age string instead of calculated group
        // last_visit_date is optional
        last_visit_date: formData.last_visit_date || null
      };

      const res = await fetch('http://localhost:8000/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Visitor details saved successfully!');
        setFormData({
          name: '', age: '', email: '', nationality: 'India', preferred_language: 'English',
          last_visit_date: '', ticket_type: 'Standard', id_proof: 'Voter ID', contact: ''
        });
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed to submit", error);
      alert("Failed to connect to server.");
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white font-sans">
      {/* Navigation */}
      <nav className="bg-purple-950 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">⚙️ Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-purple-100 font-medium">Welcome, {user.name}!</span>}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded shadow-md font-bold text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300">
          Museum Management Console
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Registration Form Panel (Left Column, Span 4) */}
          <div className="lg:col-span-4 bg-purple-900/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-purple-700/50">

            {/* Tabs */}
            <div className="flex bg-purple-800/50 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('visitor')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'visitor' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Visitor
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'staff' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Staff
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'finance' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Finance
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>
                {activeTab === 'visitor' ? '📝 Register Visitor' :
                  activeTab === 'staff' ? '👔 Register Staff' :
                    '💰 Record Transaction'}
              </span>
            </h3>

            {/* VISITOR FORM */}
            {activeTab === 'visitor' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${errors.name ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="25" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${errors.age ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                    {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Contact</label>
                    <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="+91..." className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${errors.contact ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                    {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${errors.email ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Nationality</label>
                    <select name="nationality" value={formData.nationality} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {COUNTRIES.map(c => <option key={c} value={c} className="bg-purple-900">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Language</label>
                    <select name="preferred_language" value={formData.preferred_language} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {LANGUAGES.map(l => <option key={l} value={l} className="bg-purple-900">{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Ticket</label>
                    <select name="ticket_type" value={formData.ticket_type} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {TICKET_TYPES.map(t => <option key={t} value={t} className="bg-purple-900">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Last Visit</label>
                    <input type="date" name="last_visit_date" value={formData.last_visit_date} onChange={handleInputChange} max={new Date().toISOString().split("T")[0]} className={`w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400`} />
                    {errors.last_visit_date && <p className="text-red-400 text-xs mt-1">{errors.last_visit_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">ID Proof</label>
                  <select name="id_proof" value={formData.id_proof} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="Voter ID" className="bg-purple-900">Voter ID</option>
                    <option value="PAN" className="bg-purple-900">PAN</option>
                    <option value="Aadhar" className="bg-purple-900">Aadhar</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded shadow transform active:scale-95 transition-all mt-2">
                  Register Visitor
                </button>
              </form>
            ) : activeTab === 'staff' ? (
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                {/* STAFF FORM */}
                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Staff Name</label>
                  <input type="text" name="name" value={staffData.name} onChange={handleStaffChange} placeholder="Jane Doe" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${staffErrors.name ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {staffErrors.name && <p className="text-red-400 text-xs mt-1">{staffErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Occupation</label>
                  <select name="occupation" value={staffData.occupation} onChange={handleStaffChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {['Customer_care', 'Tour_guide', 'Security', 'Admin', 'Manager', 'Custodian'].map(role => (
                      <option key={role} value={role} className="bg-purple-900">{role.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Contact</label>
                  <input type="tel" name="contact" value={staffData.contact} onChange={handleStaffChange} placeholder="9876543210" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${staffErrors.contact ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {staffErrors.contact && <p className="text-red-400 text-xs mt-1">{staffErrors.contact}</p>}
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Email</label>
                  <input type="email" name="email" value={staffData.email} onChange={handleStaffChange} placeholder="jane@museum.com" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${staffErrors.email ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {staffErrors.email && <p className="text-red-400 text-xs mt-1">{staffErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Joining Date</label>
                  <input type="date" name="joining_date" value={staffData.joining_date} onChange={handleStaffChange} max={new Date().toISOString().split("T")[0]} className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${staffErrors.joining_date ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {staffErrors.joining_date && <p className="text-red-400 text-xs mt-1">{staffErrors.joining_date}</p>}
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded shadow transform active:scale-95 transition-all mt-4">
                  Register Staff
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinanceSubmit} className="space-y-4">
                {/* FINANCE FORM */}
                <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Visitor ID</label>
                  <input type="number" name="visitor_id" value={financeData.visitor_id} onChange={handleFinanceChange} placeholder="1001" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${financeErrors.visitor_id ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                  {financeErrors.visitor_id && <p className="text-red-400 text-xs mt-1">{financeErrors.visitor_id}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Ticket Type</label>
                    <select name="ticket_type" value={financeData.ticket_type} onChange={handleFinanceChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {TICKET_TYPES.map(t => <option key={t} value={t} className="bg-purple-900">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Amount (₹)</label>
                    <input type="number" name="amount" value={financeData.amount} onChange={handleFinanceChange} placeholder="500" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${financeErrors.amount ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                    {financeErrors.amount && <p className="text-red-400 text-xs mt-1">{financeErrors.amount}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Method</label>
                    <select name="payment_method" value={financeData.payment_method} onChange={handleFinanceChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {['Card', 'UPI', 'Cash', 'Online'].map(m => <option key={m} value={m} className="bg-purple-900">{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Counter</label>
                    <select name="counter_id" value={financeData.counter_id} onChange={handleFinanceChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {['C1', 'C2', 'C3', 'C4'].map(c => <option key={c} value={c} className="bg-purple-900">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="discount" name="discount_applied" checked={financeData.discount_applied} onChange={handleFinanceChange} className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500" />
                  <label htmlFor="discount" className="text-purple-200 text-sm font-semibold">Apply Discount?</label>
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded shadow transform active:scale-95 transition-all mt-4">
                  Record Transaction
                </button>
              </form>
            )}

          </div>

          {/* Right Side - Analytics (Span 8) */}
          <div className="lg:col-span-8 grid gap-8 content-start">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-purple-800/40 p-6 rounded-xl border border-purple-700/50 backdrop-blur-sm hover:bg-purple-800/60 transition">
                <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Total Visitors</h4>
                <p className="text-4xl font-black text-white">2,847</p>
                <span className="text-green-400 text-xs">↑ 12% this week</span>
              </div>
              {/* Card 2 */}
              <div className="bg-purple-800/40 p-6 rounded-xl border border-purple-700/50 backdrop-blur-sm hover:bg-purple-800/60 transition">
                <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Revenue</h4>
                <p className="text-4xl font-black text-white">$15k</p>
                <span className="text-green-400 text-xs">↑ 8% this month</span>
              </div>
              {/* Card 3 */}
              <div className="bg-purple-800/40 p-6 rounded-xl border border-purple-700/50 backdrop-blur-sm hover:bg-purple-800/60 transition">
                <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Active Tours</h4>
                <p className="text-4xl font-black text-white">8</p>
                <span className="text-gray-400 text-xs">Currently ongoing</span>
              </div>
              {/* Card 4 */}
              <div className="bg-purple-800/40 p-6 rounded-xl border border-purple-700/50 backdrop-blur-sm hover:bg-purple-800/60 transition">
                <h4 className="text-purple-300 text-sm uppercase tracking-wider mb-2">Feedback</h4>
                <p className="text-4xl font-black text-white">4.8</p>
                <span className="text-yellow-400 text-xs">★★★★★</span>
              </div>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-purple-900/40 p-8 rounded-xl border border-purple-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 text-white">Visitors by Category</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Students', val: '35%', color: 'bg-blue-500' },
                    { label: 'Adults', val: '40%', color: 'bg-green-500' },
                    { label: 'Seniors', val: '15%', color: 'bg-yellow-500' },
                    { label: 'VIP', val: '10%', color: 'bg-pink-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1 text-purple-200">
                        <span>{item.label}</span>
                        <span>{item.val}</span>
                      </div>
                      <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-900/40 p-8 rounded-xl border border-purple-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 text-white">Weekly Footfall</h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {[40, 65, 45, 90, 75, 55, 80].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg hover:from-purple-500 hover:to-purple-300 transition-all cursor-pointer" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-purple-300">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
