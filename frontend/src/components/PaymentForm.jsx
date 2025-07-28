import React, { useState, useEffect } from 'react';
import api from '../api';

export default function PaymentForm() {
  const customerId = 1;  // hardcoded or from props

  const [form, setForm] = useState({
    loan_id: '',
    amount: '',
    payment_type: 'EMI',
  });
  const [loans, setLoans] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [emiAmount, setEmiAmount] = useState(null);
  const [amountDisabled, setAmountDisabled] = useState(true);

  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');

  useEffect(() => {
    // Fetch loans for dropdown
    api.get(`/customers/${customerId}/overview`)
      .then(res => setLoans(res.data.loans))
      .catch(err => setError(err.response?.data?.error || err.message));
  }, [customerId]);

  useEffect(() => {
    // Update amount field and disabled state when payment_type or loan_id changes
    if (form.payment_type === 'EMI' && form.loan_id) {
      // Find selected loan EMI
      const selectedLoan = loans.find(loan => loan.loan_id === parseInt(form.loan_id));
      if (selectedLoan) {
        setEmiAmount(selectedLoan.emi_amount);
        setForm(form => ({ ...form, amount: selectedLoan.emi_amount }));
        setAmountDisabled(true);
      } else {
        setEmiAmount(null);
        setForm(form => ({ ...form, amount: '' }));
        setAmountDisabled(false);
      }
    } else {
      // For LUMP_SUM payment type, amount is editable and cleared
      setAmountDisabled(false);
      setForm(form => ({ ...form, amount: '' }));
    }
  }, [form.payment_type, form.loan_id, loans]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(form => ({ ...form, [name]: value }));

    // Clear previous results and errors when inputs change
    if (result) setResult(null);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.loan_id) {
      setError('Please select a loan');
      return;
    }
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError('Please enter a valid amount');
      return;
    }

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
        <label>Select Loan:</label>
        <select name="loan_id" value={form.loan_id} onChange={handleChange} required>
          <option value="">-- Select Loan --</option>
          {activeLoans.map(loan => (
            <option key={loan.loan_id} value={loan.loan_id}>
              Loan {loan.loan_id} - ₹{loan.principal.toFixed(2)}
            </option>
          ))}
        </select>

        <label>Amount:</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          required
          min="1"
          step="0.01"
          disabled={amountDisabled}
        />

        <label>Payment Type:</label>
        <select name="payment_type" value={form.payment_type} onChange={handleChange}>
          <option value="EMI">EMI</option>
          <option value="LUMP_SUM">Lump Sum</option>
        </select>

        <button type="submit" style={{ marginTop: 15 }}>Pay</button>
      </form>

      {error && <p className="error" style={{ color: 'red', marginTop: 10 }}>{error}</p>}
      {result && (
        <div className="result" style={{ marginTop: 20, color: 'green' }}>
          <p>{result.message}</p>
          <p>Remaining Balance: ₹{result.remaining_balance}</p>
          <p>EMIs Left: {result.emis_left}</p>
        </div>
      )}
    </div>
  );
}
