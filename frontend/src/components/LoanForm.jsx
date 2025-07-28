import React, { useState } from 'react';
import api from '../api';

export default function LoanForm({ customer_id }) {  // receive customer_id as prop
  const [form, setForm] = useState({
    loan_amount: '',
    loan_period_years: '',
    interest_rate: '',
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!customer_id) {
      setError('Customer ID is missing. Please login or select a customer.');
      return;
    }

    try {
      const res = await api.post('/loans', {
        customer_id: customer_id,  // submit with known customer_id
        loan_amount: parseFloat(form.loan_amount),
        loan_period_years: parseInt(form.loan_period_years, 10),
        interest_rate: parseFloat(form.interest_rate),
      });
      setResult(res.data);
      setForm({
        loan_amount: '',
        loan_period_years: '',
        interest_rate: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="loan-form">
      <h2>Create a Loan</h2>
      <form onSubmit={handleSubmit}>

        <label>Loan Amount:</label>
        <input
          type="number"
          name="loan_amount"
          value={form.loan_amount}
          onChange={handleChange}
          required
          min="1"
          step="0.01"
        />

        <label>Loan Period (years):</label>
        <input
          type="number"
          name="loan_period_years"
          value={form.loan_period_years}
          onChange={handleChange}
          required
          min="1"
        />

        <label>Interest Rate (%):</label>
        <input
          type="number"
          name="interest_rate"
          value={form.interest_rate}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
        />

        <button type="submit">Create Loan</button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      {result && (
        <div className="result">
          <p>Loan created successfully!</p>
          <p><b>Loan ID:</b> {result.loan_id}</p>
          <p><b>Total Amount:</b> ₹{result.total_amount.toFixed(2)}</p>
          <p><b>Monthly EMI:</b> ₹{result.monthly_emi.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
