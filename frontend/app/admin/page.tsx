'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock Lists for Dropdowns
const COUNTRIES = ["India", "USA", "UK", "France", "Germany", "Japan", "China", "Australia", "Canada", "Other"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Mandarin", "Other"];
const TICKET_TYPES = ["Standard", "VIP", "Student"];

const DonutChart = ({ data }: { data: { condition_status: string, count: number }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  let currentPercent = 0;

  const getColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('good') || s.includes('excellent')) return '#22c55e'; // green-500
    if (s.includes('restored')) return '#3b82f6'; // blue-500
    if (s.includes('repair') || s.includes('damaged')) return '#ef4444'; // red-500
    return '#a855f7'; // purple-500
  };

  const gradientString = data.length > 0 ? data.map(item => {
    const start = currentPercent;
    const percent = (item.count / total) * 100;
    currentPercent += percent;
    return `${getColor(item.condition_status)} ${start}% ${currentPercent}%`;
  }).join(', ') : '#4b5563 0% 100%';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 rounded-full shadow-xl" style={{ background: `conic-gradient(${gradientString})` }}>
        {/* Inner Circle for Donut */}
        <div className="absolute inset-3 bg-purple-950 rounded-full flex flex-col items-center justify-center border-4 border-purple-900/50">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-xs text-purple-300 uppercase tracking-widest">Artifacts</span>
        </div>
      </div>
      <div className="mt-6 w-full grid grid-cols-2 gap-3 text-xs">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 bg-purple-900/50 p-2 rounded border border-purple-800">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getColor(d.condition_status) }}></div>
            <div className="flex flex-col">
              <span className="text-purple-200 font-medium">{d.condition_status}</span>
              <span className="text-white font-bold">{d.count} items</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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



  // Gallery State
  const [galleries, setGalleries] = useState<any[]>([]);
  const [galleryData, setGalleryData] = useState({ name: '', floor_number: '', theme: '', average_visit_count: '0', total_artefacts: '0' });
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);

  // Artifact State
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [artifactData, setArtifactData] = useState({
    gallery_id: '',
    historical_period: '',
    category: '',
    material: '',
    condition_status: 'Excellent',
    audio_guide_id: ''
  });
  const [editingArtifactId, setEditingArtifactId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'visitor' | 'staff' | 'finance' | 'tours' | 'gallery' | 'artifact'>('visitor');

  // --- FILTER STATE ---
  const [tourSearch, setTourSearch] = useState({ type: 'Date', date: '', guide_id: '', status: 'Scheduled' });
  const [gallerySearch, setGallerySearch] = useState({ name: '' });
  const [artifactSearch, setArtifactSearch] = useState({ type: 'Gallery', value: '' });

  // New Search States
  const [visitorSearch, setVisitorSearch] = useState({ name: '', nationality: '' });
  const [staffSearch, setStaffSearch] = useState({ type: 'Role', role: 'Tour_guide', name: '' });
  const [financeSearch, setFinanceSearch] = useState({ startDate: '', endDate: '', paymentMethod: '' });

  // New Data Lists
  const [visitors, setVisitors] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [editingVisitorId, setEditingVisitorId] = useState<number | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  // Analytics State
  const [artifactAnalytics, setArtifactAnalytics] = useState<any[]>([]);

  // --- SEARCH HANDLERS ---
  const searchTours = () => {
    let url = 'http://localhost:8000/api/tours?';
    if (tourSearch.type === 'Date' && tourSearch.date) url += `date=${tourSearch.date}`;
    else if (tourSearch.type === 'Guide Name' && tourSearch.guide_id) url += `guide_id=${tourSearch.guide_id}`;
    else if (tourSearch.type === 'Status' && tourSearch.status) url += `status=${tourSearch.status}`;

    fetch(url)
      .then(res => res.json())
      .then(setTours)
      .catch(e => console.error(e));
  };

  // Wait, I need to add 'tours' state first.
  const [tours, setTours] = useState<any[]>([]);

  const searchGalleries = () => {
    const term = encodeURIComponent(gallerySearch.name.trim());
    fetch(`http://localhost:8000/api/galleries?name=${term}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGalleries(data);
        else console.error("Invalid gallery data", data);
      })
      .catch(e => console.error(e));
  };

  const searchArtifacts = () => {
    let url = 'http://localhost:8000/api/artifacts?';
    if (artifactSearch.type === 'Gallery' && artifactSearch.value) url += `gallery_id=${artifactSearch.value}`;
    else if (artifactSearch.type === 'Category' && artifactSearch.value) url += `category=${artifactSearch.value}`;
    else if (artifactSearch.type === 'Period' && artifactSearch.value) url += `historical_period=${artifactSearch.value}`;

    fetch(url)
      .then(res => res.json())
      .then(setArtifacts)
      .catch(e => console.error(e));
  };

  const searchVisitors = () => {
    let url = 'http://localhost:8000/api/visitors?';
    if (visitorSearch.name) url += `name=${visitorSearch.name}&`;
    if (visitorSearch.nationality) url += `nationality=${visitorSearch.nationality}`;

    fetch(url).then(res => res.json()).then(setVisitors).catch(console.error);
  };

  const searchStaff = () => {
    let url = 'http://localhost:8000/api/staff?';
    if (staffSearch.type === 'Role' && staffSearch.role) url += `role=${staffSearch.role}`;
    else if (staffSearch.type === 'Name' && staffSearch.name) url += `name=${staffSearch.name}`;

    fetch(url).then(res => res.json()).then(setStaffList).catch(console.error);
  };

  const searchFinance = () => {
    let url = 'http://localhost:8000/api/finance?';
    if (financeSearch.startDate) url += `start_date=${financeSearch.startDate}&`;
    if (financeSearch.endDate) url += `end_date=${financeSearch.endDate}&`;
    if (financeSearch.paymentMethod) url += `payment_method=${financeSearch.paymentMethod}`;

    fetch(url).then(res => res.json()).then(setFinances).catch(console.error);
  };

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

  // Tours State
  const [tourData, setTourData] = useState({
    guide_id: '',
    tour_date: '',
    tour_time: '',
    visitor_group_name: '',
    group_size: '',
    language: 'English',
    status: 'Scheduled',
    visitor_ids: '' // Comma separated string for input
  });
  const [tourErrors, setTourErrors] = useState<{ [key: string]: string }>({});
  const [guides, setGuides] = useState<any[]>([]);


  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { router.push('/'); return; }
    const userData = JSON.parse(savedUser);
    if (userData.role !== 'admin') { router.push('/'); return; }
    setUser(userData);
    setLoading(false);
  }, [router]);

  // Fetch Guides when tours tab is active
  useEffect(() => {
    if (activeTab === 'tours') {
      fetch('http://localhost:8000/api/guides')
        .then(res => res.json())
        .then(data => setGuides(data))
        .catch(err => console.error("Failed to load guides", err));
    } else if (activeTab === 'gallery') {
      fetch('http://localhost:8000/api/galleries')
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch galleries");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setGalleries(data);
          else {
            console.error("Galleries response is not an array:", data);
            setGalleries([]);
          }
        })
        .catch(err => {
          console.error("Failed to load galleries", err);
          setGalleries([]);
        });
    } else if (activeTab === 'artifact') {
      fetch('http://localhost:8000/api/artifacts')
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch artifacts");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setArtifacts(data);
          else {
            console.error("Artifacts response is not an array:", data);
            setArtifacts([]);
          }
        })
        .catch(err => {
          console.error("Failed to load artifacts", err);
          setArtifacts([]);
        });

      // Also need galleries for dropdown
      fetch('http://localhost:8000/api/galleries')
        .then(res => {
          if (!res.ok) return [];
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setGalleries(data);
        })
        .catch(err => console.error("Failed to load galleries for dropdown", err));
    }
  }, [activeTab]);

  // Fetch Analytics on Mount
  useEffect(() => {
    fetch('http://localhost:8000/api/analytics/artifact-status')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setArtifactAnalytics(data);
      })
      .catch(err => console.error("Failed to fetch analytics", err));
  }, []);

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

      const url = editingStaffId ? `http://localhost:8000/api/staff/${editingStaffId}` : 'http://localhost:8000/api/staff';
      const method = editingStaffId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingStaffId ? 'Staff updated successfully!' : 'Staff registered successfully!');
        setStaffData({ name: '', occupation: 'Tour_guide', contact: '', joining_date: '', email: '' });
        setEditingStaffId(null);
        searchStaff();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to connect to server.");
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Delete staff member?")) return;
    await fetch(`http://localhost:8000/api/staff/${id}`, { method: 'DELETE' });
    searchStaff();
  };

  const startEditStaff = (s: any) => {
    setStaffData({
      name: s.name, occupation: s.occupation, contact: s.contact,
      joining_date: s.joining_date, email: s.email
    });
    setEditingStaffId(s.staff_id);
    setActiveTab('staff');
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

      const url = editingTransactionId ? `http://localhost:8000/api/finance/${editingTransactionId}` : 'http://localhost:8000/api/finance';
      const method = editingTransactionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingTransactionId ? 'Transaction updated!' : 'Transaction recorded successfully!');
        setFinanceData({
          visitor_id: '', ticket_type: 'Standard', amount: '',
          payment_method: 'Card', discount_applied: false, counter_id: 'C1'
        });
        setEditingTransactionId(null);
        searchFinance();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to connect to server.");
    }
  };

  const startEditFinance = (f: any) => {
    setFinanceData({
      visitor_id: String(f.visitor_id), ticket_type: f.ticket_type, amount: String(f.amount),
      payment_method: f.payment_method, discount_applied: f.discount_applied, counter_id: f.counter_id
    });
    setEditingTransactionId(f.transaction_id);
    setActiveTab('finance');
  };

  // --- TOUR HANDLERS ---
  const handleTourChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTourData(prev => ({ ...prev, [name]: value }));
    if (tourErrors[name]) setTourErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateTourForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tourData.guide_id) newErrors.guide_id = "Please select a guide.";
    if (!tourData.visitor_group_name.trim()) newErrors.visitor_group_name = "Group Name is required.";
    if (!tourData.group_size || Number(tourData.group_size) <= 0) newErrors.group_size = "Valid group size required.";
    if (!tourData.tour_date) newErrors.tour_date = "Date is required.";
    if (!tourData.tour_time) newErrors.tour_time = "Time is required.";
    if (!tourData.visitor_ids.trim()) {
      newErrors.visitor_ids = "Enter at least one Visitor ID.";
    } else {
      // simple check if comma separated numbers
      const ids = tourData.visitor_ids.split(',').map(s => s.trim());
      if (ids.some(id => isNaN(Number(id)))) newErrors.visitor_ids = "IDs must be numbers separated by commas.";
    }

    setTourErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // --- GALLERY HANDLERS ---
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleryData({ ...galleryData, [e.target.name]: e.target.value });
  };



  const validateGalleryForm = () => {
    if (!galleryData.name.trim()) { alert("Gallery Name is required"); return false; }
    if (!galleryData.floor_number || Number(galleryData.floor_number) <= 0) { alert("Valid Floor Number is required"); return false; }
    if (!galleryData.theme.trim()) { alert("Theme is required"); return false; }
    return true;
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGalleryForm()) return;

    const url = editingGalleryId ? `http://localhost:8000/api/galleries/${editingGalleryId}` : 'http://localhost:8000/api/galleries';
    const method = editingGalleryId ? 'PUT' : 'POST';
    const payload = {
      ...galleryData,
      floor_number: Number(galleryData.floor_number),
      average_visit_count: Number(galleryData.average_visit_count),
      total_artefacts: Number(galleryData.total_artefacts)
    };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert(editingGalleryId ? 'Gallery updated!' : 'Gallery created!');
        setGalleryData({ name: '', floor_number: '', theme: '', average_visit_count: '0', total_artefacts: '0' });
        setEditingGalleryId(null);
        // Refresh list
        fetch('http://localhost:8000/api/galleries').then(r => r.json()).then(setGalleries);
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (e) { console.error(e); alert("Failed"); }
  };

  const handleDeleteGallery = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/galleries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleries(prev => prev.filter(g => g.gallery_id !== id));
      }
    } catch (e) { console.error(e); alert("Failed"); }
  };

  const startEditGallery = (g: any) => {
    setGalleryData({
      name: g.name, floor_number: String(g.floor_number), theme: g.theme,
      average_visit_count: String(g.average_visit_count || 0), total_artefacts: String(g.total_artefacts || 0)
    });
    setEditingGalleryId(g.gallery_id);
    setActiveTab('gallery'); // Access form
  };

  // --- ARTIFACT HANDLERS ---
  const handleArtifactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setArtifactData({ ...artifactData, [e.target.name]: e.target.value });
  };

  const validateArtifactForm = () => {
    if (!artifactData.gallery_id) { alert("Please select a Gallery"); return false; }
    if (!artifactData.category.trim()) { alert("Category is required"); return false; }
    if (!artifactData.historical_period.trim()) { alert("Historical Period is required"); return false; }
    if (!artifactData.material.trim()) { alert("Material is required"); return false; }
    return true;
  };

  const handleArtifactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateArtifactForm()) return;

    const url = editingArtifactId ? `http://localhost:8000/api/artifacts/${editingArtifactId}` : 'http://localhost:8000/api/artifacts';
    const method = editingArtifactId ? 'PUT' : 'POST';
    const payload = {
      ...artifactData,
      gallery_id: Number(artifactData.gallery_id),
      audio_guide_id: artifactData.audio_guide_id ? Number(artifactData.audio_guide_id) : null
    };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert(editingArtifactId ? 'Artifact updated!' : 'Artifact created!');
        setArtifactData({ gallery_id: '', historical_period: '', category: '', material: '', condition_status: 'Excellent', audio_guide_id: '' });
        setEditingArtifactId(null);
        fetch('http://localhost:8000/api/artifacts').then(r => r.json()).then(setArtifacts);
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (e) { console.error(e); alert("Failed"); }
  };

  const handleDeleteArtifact = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/artifacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArtifacts(prev => prev.filter(a => a.artifact_id !== id));
      }
    } catch (e) { console.error(e); alert("Failed"); }
  };

  const startEditArtifact = (a: any) => {
    setArtifactData({
      gallery_id: String(a.gallery_id), historical_period: a.historical_period, category: a.category,
      material: a.material, condition_status: a.condition_status, audio_guide_id: String(a.audio_guide_id || '')
    });
    setEditingArtifactId(a.artifact_id);
    setActiveTab('artifact');
  };

  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTourForm()) return;

    try {
      const payload = {
        ...tourData,
        guide_id: Number(tourData.guide_id),
        group_size: Number(tourData.group_size),
        visitor_ids: tourData.visitor_ids.split(',').map(s => Number(s.trim())) // Convert string "1,2,3" to [1,2,3]
      };

      const res = await fetch('http://localhost:8000/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Tour scheduled successfully!');
        setTourData({
          guide_id: '', tour_date: '', tour_time: '', visitor_group_name: '',
          group_size: '', language: 'English', status: 'Scheduled', visitor_ids: ''
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

      const url = editingVisitorId ? `http://localhost:8000/api/visitors/${editingVisitorId}` : 'http://localhost:8000/api/visitors';
      const method = editingVisitorId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingVisitorId ? 'Visitor details updated!' : 'Visitor registered successfully!');
        setFormData({
          name: '', age: '', email: '', nationality: 'India', preferred_language: 'English',
          last_visit_date: '', ticket_type: 'Standard', id_proof: 'Voter ID', contact: ''
        });
        setEditingVisitorId(null);
        searchVisitors(); // Refresh list if search was active
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to connect to server.");
    }
  };

  const startEditVisitor = (v: any) => {
    setFormData({
      name: v.name, age: v.age_group, email: v.email, nationality: v.nationality,
      preferred_language: v.preferred_language, last_visit_date: v.last_visit_date || '',
      ticket_type: v.ticket_type, id_proof: v.id_proof, contact: v.contact
    });
    setEditingVisitorId(v.visitor_id);
    setActiveTab('visitor');
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
              <button
                onClick={() => setActiveTab('tours')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'tours' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Tours
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'gallery' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('artifact')}
                className={`flex-1 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'artifact' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Artifact
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>
                {activeTab === 'visitor' ? '📝 Register Visitor' :
                  activeTab === 'staff' ? '👔 Register Staff' :
                    activeTab === 'finance' ? '💰 Record Transaction' :
                      activeTab === 'tours' ? '📅 Schedule Tour' :
                        activeTab === 'gallery' ? '🖼️ Manage Gallery' : '🏺 Manage Artifacts'}
              </span>
            </h3>

            {/* VISITOR FORM */}
            {activeTab === 'visitor' ? (
              <>
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
                {/* VISITOR SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">Search Visitors</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={visitorSearch.name}
                      onChange={(e) => setVisitorSearch({ ...visitorSearch, name: e.target.value })}
                      placeholder="Search by Name..."
                      className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600 text-white placeholder-purple-400"
                    />

                    <select
                      value={visitorSearch.nationality}
                      onChange={(e) => setVisitorSearch({ ...visitorSearch, nationality: e.target.value })}
                      className="bg-purple-800/50 text-white rounded px-3 py-2 border border-purple-600"
                    >
                      <option value="">All Nationalities</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button onClick={searchVisitors} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Search</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-purple-100">
                      <thead className="bg-purple-800 text-purple-300 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Contact</th>
                          <th className="px-4 py-2">Ticket</th>
                          <th className="px-4 py-2">Last Visit</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map(v => (
                          <tr key={v.visitor_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{v.visitor_id}</td>
                            <td className="px-4 py-2 font-bold">{v.name}</td>
                            <td className="px-4 py-2">{v.contact}</td>
                            <td className="px-4 py-2">{v.ticket_type}</td>
                            <td className="px-4 py-2">{v.last_visit_date}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => startEditVisitor(v)} className="text-blue-400 hover:text-blue-300">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </>
            ) : activeTab === 'staff' ? (
              <>
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

                {/* STAFF SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">Manage Staff</h4>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={staffSearch.type}
                      onChange={(e) => setStaffSearch({ ...staffSearch, type: e.target.value })}
                      className="bg-purple-800 text-white rounded px-3 py-2 border border-purple-600"
                    >
                      <option>Role</option>
                      <option>Name</option>
                    </select>

                    {staffSearch.type === 'Role' ? (
                      <select value={staffSearch.role} onChange={e => setStaffSearch({ ...staffSearch, role: e.target.value })} className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600">
                        {['Customer_care', 'Tour_guide', 'Security', 'Admin', 'Manager', 'Custodian'].map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={staffSearch.name}
                        onChange={e => setStaffSearch({ ...staffSearch, name: e.target.value })}
                        placeholder="Search by Name..."
                        className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600 text-white placeholder-purple-400"
                      />
                    )}
                    <button onClick={searchStaff} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Search</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-purple-100">
                      <thead className="bg-purple-800 text-purple-300 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Role</th>
                          <th className="px-4 py-2">Contact</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map(s => (
                          <tr key={s.staff_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{s.staff_id}</td>
                            <td className="px-4 py-2 font-bold">{s.name}</td>
                            <td className="px-4 py-2">{s.occupation}</td>
                            <td className="px-4 py-2">{s.contact}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => startEditStaff(s)} className="text-blue-400 hover:text-blue-300">Edit</button>
                              <button onClick={() => handleDeleteStaff(s.staff_id)} className="text-red-400 hover:text-red-300">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : activeTab === 'finance' ? (
              <>
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

                {/* FINANCE SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">View Transactions</h4>
                  <div className="flex gap-2 mb-4">
                    <input type="date" value={financeSearch.startDate} onChange={e => setFinanceSearch({ ...financeSearch, startDate: e.target.value })} className="bg-purple-800/50 rounded px-3 py-2 border border-purple-600" />
                    <span className="text-white self-center">to</span>
                    <input type="date" value={financeSearch.endDate} onChange={e => setFinanceSearch({ ...financeSearch, endDate: e.target.value })} className="bg-purple-800/50 rounded px-3 py-2 border border-purple-600" />

                    <select value={financeSearch.paymentMethod} onChange={e => setFinanceSearch({ ...financeSearch, paymentMethod: e.target.value })} className="bg-purple-800/50 rounded px-3 py-2 border border-purple-600">
                      <option value="">All Methods</option>
                      {['Card', 'UPI', 'Cash', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <button onClick={searchFinance} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Filter</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-purple-100">
                      <thead className="bg-purple-800 text-purple-300 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Visitor</th>
                          <th className="px-4 py-2">Amount</th>
                          <th className="px-4 py-2">Method</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finances.map(f => (
                          <tr key={f.transaction_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{f.transaction_id}</td>
                            <td className="px-4 py-2">{f.visitor_id}</td>
                            <td className="px-4 py-2">₹{f.amount}</td>
                            <td className="px-4 py-2">{f.payment_method}</td>
                            <td className="px-4 py-2">{f.transaction_date}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => startEditFinance(f)} className="text-blue-400 hover:text-blue-300">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : activeTab === 'tours' ? (
              <>
                <form onSubmit={handleTourSubmit} className="space-y-4">
                  {/* TOURS FORM */}
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Group Name</label>
                    <input type="text" name="visitor_group_name" value={tourData.visitor_group_name} onChange={handleTourChange} placeholder="School Group A" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.visitor_group_name ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                    {tourErrors.visitor_group_name && <p className="text-red-400 text-xs mt-1">{tourErrors.visitor_group_name}</p>}
                  </div>

                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Assign Guide</label>
                    <select name="guide_id" value={tourData.guide_id} onChange={handleTourChange} className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.guide_id ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`}>
                      <option value="">-- Select Guide --</option>
                      {guides.map(g => (
                        <option key={g.staff_id} value={g.staff_id} className="bg-purple-900">{g.name}</option>
                      ))}
                    </select>
                    {tourErrors.guide_id && <p className="text-red-400 text-xs mt-1">{tourErrors.guide_id}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Date</label>
                      <input type="date" name="tour_date" value={tourData.tour_date} onChange={handleTourChange} className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.tour_date ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                      {tourErrors.tour_date && <p className="text-red-400 text-xs mt-1">{tourErrors.tour_date}</p>}
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Time</label>
                      <input type="time" name="tour_time" value={tourData.tour_time} onChange={handleTourChange} className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.tour_time ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                      {tourErrors.tour_time && <p className="text-red-400 text-xs mt-1">{tourErrors.tour_time}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Group Size</label>
                      <input type="number" name="group_size" value={tourData.group_size} onChange={handleTourChange} placeholder="20" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.group_size ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                      {tourErrors.group_size && <p className="text-red-400 text-xs mt-1">{tourErrors.group_size}</p>}
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Language</label>
                      <select name="language" value={tourData.language} onChange={handleTourChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        {LANGUAGES.map(l => <option key={l} value={l} className="bg-purple-900">{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Visitor IDs (Comma Sep)</label>
                    <input type="text" name="visitor_ids" value={tourData.visitor_ids} onChange={handleTourChange} placeholder="1001, 1002, 1005" className={`w-full px-3 py-2 rounded bg-purple-800/50 border ${tourErrors.visitor_ids ? 'border-red-500' : 'border-purple-600'} focus:outline-none focus:ring-2 focus:ring-purple-400`} required />
                    <p className="text-gray-400 text-xs mt-1">IDs of visitors in this group.</p>
                    {tourErrors.visitor_ids && <p className="text-red-400 text-xs mt-1">{tourErrors.visitor_ids}</p>}
                  </div>

                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Status</label>
                    <select name="status" value={tourData.status} onChange={handleTourChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {['Scheduled', 'Completed', 'Cancelled', 'Pending'].map(s => <option key={s} value={s} className="bg-purple-900">{s}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded shadow transform active:scale-95 transition-all mt-4">
                    Schedule Tour
                  </button>
                </form>

                {/* TOUR SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">Manage Tours</h4>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={tourSearch.type}
                      onChange={(e) => setTourSearch({ ...tourSearch, type: e.target.value })}
                      className="bg-purple-800 text-white rounded px-3 py-2 border border-purple-600"
                    >
                      <option>Date</option>
                      <option>Guide Name</option>
                      <option>Status</option>
                    </select>

                    {tourSearch.type === 'Date' &&
                      <input type="date" value={tourSearch.date} onChange={e => setTourSearch({ ...tourSearch, date: e.target.value })} className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600" />
                    }
                    {tourSearch.type === 'Guide Name' &&
                      <select value={tourSearch.guide_id} onChange={e => setTourSearch({ ...tourSearch, guide_id: e.target.value })} className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600">
                        <option value="">Select Guide</option>
                        {guides.map(g => <option key={g.staff_id} value={g.staff_id}>{g.name}</option>)}
                      </select>
                    }
                    {tourSearch.type === 'Status' &&
                      <select value={tourSearch.status} onChange={e => setTourSearch({ ...tourSearch, status: e.target.value })} className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600">
                        <option>Scheduled</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    }

                    <button onClick={searchTours} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Search</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-purple-100">
                      <thead className="bg-purple-800 text-purple-300 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2">Group</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Created</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tours.map((t: any) => (
                          <tr key={t.tour_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{t.tour_id}</td>
                            <td className="px-4 py-2">{t.tour_date}</td>
                            <td className="px-4 py-2">{t.tour_time}</td>
                            <td className="px-4 py-2">{t.visitor_group_name}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${t.status === 'Scheduled' ? 'bg-yellow-600' : t.status === 'Completed' ? 'bg-green-600' : 'bg-red-600'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => {
                                // Populate form for edit
                                setTourData({
                                  guide_id: String(t.guide_id),
                                  tour_date: t.tour_date,
                                  tour_time: t.tour_time,
                                  visitor_group_name: t.visitor_group_name,
                                  group_size: String(t.group_size),
                                  language: t.language,
                                  status: t.status,
                                  visitor_ids: Array.isArray(t.visitor_ids) ? t.visitor_ids.join(', ') : t.visitor_ids
                                });
                                // We'd ideally need an editing ID for Update logic (not implemented fully for Tours yet, using Create logic mostly)
                                // For now, let's just populate.
                              }} className="text-blue-400 hover:text-blue-300">Edit</button>
                              <button onClick={async () => {
                                if (!confirm("Delete tour?")) return;
                                await fetch(`http://localhost:8000/api/tours/${t.tour_id}`, { method: 'DELETE' });
                                searchTours(); // Refresh
                              }} className="text-red-400 hover:text-red-300">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : activeTab === 'gallery' ? (
              <>
                <form onSubmit={handleGallerySubmit} className="space-y-4">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Gallery Name</label>
                    <input type="text" name="name" value={galleryData.name} onChange={handleGalleryChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Floor No.</label>
                      <input type="number" name="floor_number" value={galleryData.floor_number} onChange={handleGalleryChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Theme</label>
                      <input type="text" name="theme" value={galleryData.theme} onChange={handleGalleryChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </div>
                  </div>
                  {/* Optional Analytics fields if manual entry desired */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Avg Visits</label>
                      <input type="number" name="average_visit_count" value={galleryData.average_visit_count} onChange={handleGalleryChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Total Artifacts</label>
                      <input type="number" name="total_artefacts" value={galleryData.total_artefacts} onChange={handleGalleryChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded shadow transition-all">
                      {editingGalleryId ? 'Update Gallery' : 'Create Gallery'}
                    </button>
                    {editingGalleryId && <button type="button" onClick={() => { setEditingGalleryId(null); setGalleryData({ name: '', floor_number: '', theme: '', average_visit_count: '0', total_artefacts: '0' }) }} className="px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-500">Cancel</button>}
                  </div>
                </form>

                {/* GALLERY SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">Search Galleries</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Enter Gallery Name..."
                      value={gallerySearch.name}
                      onChange={e => setGallerySearch({ name: e.target.value })}
                      className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600 text-white placeholder-purple-400"
                    />
                    <button onClick={searchGalleries} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Search</button>
                  </div>

                  <div className="overflow-x-auto">
                    <h4 className="text-sm uppercase font-bold text-purple-300 mb-2">Results</h4>
                    <table className="w-full text-left text-sm text-purple-100">

                      <thead className="text-xs uppercase bg-purple-800 text-purple-300">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Floor</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {galleries.map(g => (
                          <tr key={g.gallery_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{g.gallery_id}</td>
                            <td className="px-4 py-2 font-bold">{g.name}</td>
                            <td className="px-4 py-2">{g.floor_number}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => startEditGallery(g)} className="text-blue-400 hover:text-blue-300">Edit</button>
                              <button onClick={() => handleDeleteGallery(g.gallery_id)} className="text-red-400 hover:text-red-300">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : activeTab === 'artifact' ? (
              <>
                <form onSubmit={handleArtifactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Select Gallery</label>
                    <select name="gallery_id" value={artifactData.gallery_id} onChange={handleArtifactChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required>
                      <option value="">-- Select Gallery --</option>
                      {galleries.map(g => <option key={g.gallery_id} value={g.gallery_id} className="bg-purple-900">{g.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Category</label>
                      <input type="text" name="category" value={artifactData.category} onChange={handleArtifactChange} placeholder="Manuscript" className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Period</label>
                      <input type="text" name="historical_period" value={artifactData.historical_period} onChange={handleArtifactChange} placeholder="Chola Dynasty" className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Material</label>
                      <input type="text" name="material" value={artifactData.material} onChange={handleArtifactChange} placeholder="Gold" className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Condition</label>
                      <select name="condition_status" value={artifactData.condition_status} onChange={handleArtifactChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        {['Excellent', 'Good', 'Restored', 'Needs Restoration', 'Damaged'].map(s => <option key={s} value={s} className="bg-purple-900">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-xs font-bold uppercase tracking-wide mb-1">Audio Guide ID (Optional)</label>
                    <input type="number" name="audio_guide_id" value={artifactData.audio_guide_id} onChange={handleArtifactChange} className="w-full px-3 py-2 rounded bg-purple-800/50 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded shadow transition-all">
                      {editingArtifactId ? 'Update Artifact' : 'Add Artifact'}
                    </button>
                    {editingArtifactId && <button type="button" onClick={() => { setEditingArtifactId(null); setArtifactData({ gallery_id: '', historical_period: '', category: '', material: '', condition_status: 'Excellent', audio_guide_id: '' }) }} className="px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-500">Cancel</button>}
                  </div>
                </form>

                {/* ARTIFACT SEARCH & LIST */}
                <div className="mt-8 pt-6 border-t border-purple-700">
                  <h4 className="text-xl font-bold mb-4 text-purple-200">Search Artifacts</h4>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={artifactSearch.type}
                      onChange={(e) => setArtifactSearch({ ...artifactSearch, type: e.target.value, value: '' })} // Reset value on type change
                      className="bg-purple-800 text-white rounded px-3 py-2 border border-purple-600 w-1/3"
                    >
                      <option>Gallery</option>
                      <option>Category</option>
                      <option>Period</option>
                    </select>

                    {artifactSearch.type === 'Gallery' ? (
                      <select
                        value={artifactSearch.value}
                        onChange={e => setArtifactSearch({ ...artifactSearch, value: e.target.value })}
                        className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600"
                      >
                        <option value="">Select Gallery</option>
                        {galleries.map(g => <option key={g.gallery_id} value={g.gallery_id}>{g.name}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={artifactSearch.type === 'Category' ? "e.g. Manuscript" : "e.g. Chola Dynasty"}
                        value={artifactSearch.value}
                        onChange={e => setArtifactSearch({ ...artifactSearch, value: e.target.value })}
                        className="flex-1 bg-purple-800/50 rounded px-3 py-2 border border-purple-600"
                      />
                    )}

                    <button onClick={searchArtifacts} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Search</button>
                  </div>

                  <div className="overflow-x-auto">
                    <h4 className="text-sm uppercase font-bold text-purple-300 mb-2">Results</h4>
                    <table className="w-full text-left text-sm text-purple-100">
                      <thead className="text-xs uppercase bg-purple-800 text-purple-300">
                        <tr>
                          <th className="px-4 py-2">ID</th>
                          <th className="px-4 py-2">Category</th>
                          <th className="px-4 py-2">Period</th>
                          <th className="px-4 py-2">Material</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artifacts.map(a => (
                          <tr key={a.artifact_id} className="border-b border-purple-800 hover:bg-purple-800/30">
                            <td className="px-4 py-2">{a.artifact_id}</td>
                            <td className="px-4 py-2 font-bold">{a.category}</td>
                            <td className="px-4 py-2">{a.historical_period}</td>
                            <td className="px-4 py-2">{a.material}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button onClick={() => startEditArtifact(a)} className="text-blue-400 hover:text-blue-300">Edit</button>
                              <button onClick={() => handleDeleteArtifact(a.artifact_id)} className="text-red-400 hover:text-red-300">Del</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Right Side - Analytics (Span 8) */}
          <div className="lg:col-span-8 grid gap-8 content-start">
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

              {/* Artifact Analytics Chart */}
              <div className="bg-purple-900/40 p-8 rounded-xl border border-purple-700/50 backdrop-blur-sm md:col-span-2 lg:col-span-1">
                <h3 className="text-xl font-bold mb-6 text-white border-b border-purple-700 pb-2">🏺 Artifact Conditions</h3>
                <DonutChart data={artifactAnalytics} />
              </div>
            </div>
          </div>

        </div>
      </main >
    </div >
  );
}
