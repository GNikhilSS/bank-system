import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle Dark Mode"
      title="Toggle Dark Mode"
      style={{
        position: 'fixed',
        bottom: '22px',
        right: '22px',         // changed from 'left' to 'right'
        backgroundColor: 'var(--bg-nav)',
        border: 'none',
        borderRadius: '50%',
        padding: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        color: 'var(--nav-link)',
        fontSize: '24px',
        zIndex: 10000,
        transition: 'background-color 0.3s, color 0.3s',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--nav-link-active)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-nav)'}
    >
      {darkMode ? <FiSun /> : <FiMoon />}
    </button>
  );
}
