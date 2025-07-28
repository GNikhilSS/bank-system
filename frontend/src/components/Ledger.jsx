import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';

export default function Ledger() {
  const { loan_id } = useParams();
  const [ledgerData, setLedgerData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loan_id) return;
    api.get(`/loans/${loan_id}/ledger`)
      .then(res => setLedgerData(res.data))
      .catch(err => setError(err.response?.data?.error || err.message));
  }, [loan_id]);

  if (error) return <p style={{color:'red'}}>Error: {error}</p>;
  if (!ledgerData) return <p>Loading ledger...</p>;

  return (
    <div>
      <h2>Ledger for Loan ID: {ledgerData.loan_id}</h2>
      <p>Customer: {ledgerData.customer_name} (Code: {ledgerData.customer_code})</p>
      <p>Status: <b>{ledgerData.status}</b></p>
      <p>Principal: ₹{ledgerData.principal.toFixed(2)}</p>
      <p>Total Amount: ₹{ledgerData.total_amount.toFixed(2)}</p>
      <p>Monthly EMI: ₹{ledgerData.monthly_emi.toFixed(2)}</p>
      <p>Amount Paid: ₹{ledgerData.amount_paid.toFixed(2)}</p>
      <p>Balance: ₹{ledgerData.balance_amount.toFixed(2)}</p>
      <p>EMIs Left: {ledgerData.emis_left}</p>

      <h3>Transactions:</h3>
      <ul>
        {ledgerData.transactions.length === 0 && <li>No transactions recorded yet.</li>}
        {ledgerData.transactions.map(tx => (
          <li key={tx.payment_id}>
            {new Date(tx.payment_date).toLocaleString()} — <b>{tx.payment_type}</b> — ₹{tx.amount.toFixed(2)} — Remaining Balance: ₹{tx.remaining_balance.toFixed(2)}
          </li>
        ))}
      </ul>

      <Link to="/account-overview" style={{ marginTop: 20, display: 'inline-block' }}>
        ← Back to Account Overview
      </Link>
    </div>
  );
}
