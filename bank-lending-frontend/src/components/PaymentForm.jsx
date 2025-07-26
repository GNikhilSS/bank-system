import React, { useState } from 'react';
import api from '../api';

export default function PaymentForm() {
  const [form, setForm] = useState({
    loan_id: '',
    amount: '',
    payment_type: 'EMI',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const res = await api.post(`/loans/${form.loan_id}/payment`, {
        amount: parseFloat(form.amount),
        payment_type: form.payment_type,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="payment-form" style={{ marginTop: 40 }}>
      <h2>Make a Loan Payment</h2>
      <form onSubmit={handleSubmit}>
        <label>Loan ID:</label>
        <input
          type="number"
          name="loan_id"
          value={form.loan_id}
          onChange={handleChange}
          required
        />

        <label>Amount:</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          required
        />

        <label>Payment Type:</label>
        <select
          name="payment_type"
          value={form.payment_type}
          onChange={handleChange}
        >
          <option value="EMI">EMI</option>
          <option value="LUMP_SUM">Lump Sum</option>
        </select>

        <button type="submit">Pay</button>
      </form>
      {error && <p className="error">Error: {error}</p>}
      {result && (
        <div className="result">
          <p>Payment successful!</p>
          <p>Remaining Balance: ₹{result.remaining_balance}</p>
          <p>EMIs Left: {result.emis_left}</p>
        </div>
      )}
    </div>
  );
}
