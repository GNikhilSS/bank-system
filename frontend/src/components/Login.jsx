import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      // Call backend to get customer by name (assuming /api/customers/name/:name exists)
      // If you didn't add that endpoint, you can fetch all then filter - better to add it.

      const res = await api.get(`/customers/name/${encodeURIComponent(name.trim())}`);
      // Successful login - pass customer details to parent
      onLogin(res.data);
    } catch (err) {
      // Handle 404 separately (customer not found)
      if (err.response?.status === 404) {
        setError('Customer not found. Please check your name or register.');
      } else {
        setError(err.response?.data?.error || err.message || 'Login failed');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: '50px auto',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <h2 style={{ marginBottom: 20, color: '#2d3748' }}>User Login</h2>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: '600', color: '#4a5568' }}>
          Your Name:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1.8px solid #cbd5e0',
            fontSize: 16,
            marginBottom: 14,
            boxSizing: 'border-box'
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 7,
            border: 'none',
            backgroundColor: '#3182ce',
            color: 'white',
            fontWeight: '700',
            fontSize: 17,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.3s ease'
          }}
          onMouseDown={e => e.preventDefault()} // prevent focus highlight flicker
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 15, fontWeight: '600' }}>{error}</p>
      )}
    </div>
  );
}
