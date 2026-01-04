'use client';

import { useState } from 'react';
import { validateLogin } from '../utils/validation';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onClose: () => void;
}

export function LoginForm({ onLoginSuccess, onClose }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'visitor', // Default to visitor as per common use case? Or keep 'guide'. User said "have dropdown... for login". Default 'visitor' seems friendlier for public.
    password: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    // Basic validation
    // For visitor, 'password' field holds the ID.
    if (!formData.email || !formData.password) {
      setErrors(["Please fill in all fields"]);
      return;
    }

    setLoading(true);
    try {
      let response;
      let body;
      let url;

      if (formData.role === 'visitor') {
        url = 'http://localhost:8000/api/visitors/login';
        body = JSON.stringify({
          email: formData.email,
          visitor_id: parseInt(formData.password) // Reuse password field for ID
        });
      } else {
        url = 'http://localhost:8000/api/auth/login';
        body = JSON.stringify(formData);
      }

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const data = await response.json();

      if (response.ok) {
        let userObj = data.user || data.visitor;
        // Ensure role is set for redirection logic
        if (formData.role === 'visitor') {
          userObj = { ...userObj, role: 'visitor' };
          // Visitor login usually returns 'visitor' object, standard login returns 'user'
          localStorage.setItem('visitor_user', JSON.stringify(userObj)); // Keep this for existing visitor page logic
        }

        localStorage.setItem('user', JSON.stringify(userObj)); // Standard session
        onLoginSuccess(userObj);

        setFormData({ email: '', role: 'visitor', password: '' });
        onClose();
      } else {
        setApiError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      setApiError(error.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {apiError}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <ul className="list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-blue-50"
          >
            <option value="visitor">Visitor</option>
            <option value="guide">Guide</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {formData.role === 'visitor' ? 'Ticket ID (Visitor ID)' : 'Password'}
          </label>
          <input
            type={formData.role === 'visitor' ? 'number' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={formData.role === 'visitor' ? 'e.g. 1042' : 'Your password'}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
