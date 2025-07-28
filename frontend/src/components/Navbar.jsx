import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function NavBar({ darkMode, toggleDarkMode }) {
  return (
    <nav style={styles.sidebar}>
      <div style={styles.navLinksContainer}>
        <NavLink to="/" end style={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          Loan Form
        </NavLink>
        <NavLink to="/payments" style={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          Payments
        </NavLink>
        <NavLink to="/account-overview" style={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          Account Overview
        </NavLink>
      </div>
    </nav>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: 220,
    backgroundColor: 'var(--bg-nav)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2rem 1rem',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.12)',
    borderRadius: '0 12px 12px 0',
    zIndex: 1000,
  },
  navLinksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  link: {
    color: 'var(--nav-link)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.15rem',
    padding: '10px 14px',
    borderRadius: 8,
    transition: 'background-color 0.25s, color 0.25s',
  },
  activeLink: {
    backgroundColor: 'var(--nav-link-active)',
    color: 'var(--nav-link-active-text)',
    fontWeight: '700',
    padding: '10px 14px',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(78,205,196,0.5)',
  },
};
