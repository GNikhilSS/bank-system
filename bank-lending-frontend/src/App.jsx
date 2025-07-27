import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import NavBar from './components/Navbar';
import LoanForm from './components/LoanForm';
import PaymentForm from './components/PaymentForm';
import AccountOverview from './components/AccountOverview';
import Ledger from './components/Ledger';
import DarkModeToggle from './components/DarkModeToggle';

const aliceId = 1;

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <Router>
      <NavBar />
      <div style={{ marginLeft: 220, padding: '1em 2em' }}>
        <header style={{ margin: '2rem 0' }}>
          <h1>Bank Lending System (Single Customer: Alice)</h1>
        </header>
        <Routes>
          <Route path="/" element={<LoanForm customer_id={aliceId} />} />
          <Route path="/payments" element={<PaymentForm />} />
          <Route path="/account-overview" element={<AccountOverview customer_id={aliceId} />} />
          <Route path="/ledger/:loan_id" element={<Ledger />} />
        </Routes>
      </div>
      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </Router>
  );
}
