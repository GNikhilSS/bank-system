import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AccountOverview({ customer_id }) {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/customers/${customer_id}/overview`)
      .then(res => setLoans(res.data.loans))
      .catch(err => setError(err.response?.data?.error || err.message));
  }, [customer_id]);

  if (error) return <p style={{color: 'red'}}>Error: {error}</p>;
  if (!loans.length) return <p>No loans found.</p>;

  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
  const closedLoans = loans.filter(loan => loan.status === 'CLOSED');

  return (
    <div>
      <h2>Account Overview</h2>

      <section>
        <h3>Active Loans ({activeLoans.length})</h3>
        {activeLoans.length === 0 ? <p>No active loans.</p> : (
          <ul>
            {activeLoans.map(loan => (
              <li key={loan.loan_id} style={{ marginBottom: 8 }}>
                Loan ID: {loan.loan_id} | Principal: ₹{loan.principal.toFixed(2)} | EMIs Left: {loan.emis_left}
                <br />
                EMI: ₹{loan.emi_amount.toFixed(2)} | Paid: ₹{loan.amount_paid.toFixed(2)}
                <br />
                <Link to={`/ledger/${loan.loan_id}`}>View Ledger</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h3>Closed Loans ({closedLoans.length})</h3>
        {closedLoans.length === 0 ? <p>No closed loans.</p> : (
          <ul style={{ color: 'gray' }}>
            {closedLoans.map(loan => (
              <li key={loan.loan_id} style={{ marginBottom: 8 }}>
                Loan ID: {loan.loan_id} | Principal: ₹{loan.principal.toFixed(2)} | <b>Closed</b>
                <br />
                EMI: ₹{loan.emi_amount.toFixed(2)} | Paid: ₹{loan.amount_paid.toFixed(2)}
                <br />
                <Link to={`/ledger/${loan.loan_id}`}>View Ledger</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
