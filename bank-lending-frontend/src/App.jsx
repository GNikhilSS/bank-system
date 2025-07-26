import React, { useState } from 'react';
 import LoanForm from './components/LoanForm';
import './styles/App.css';
import PaymentForm from './components/PaymentForm';
import Login from './components/Login';

export default function App() {

  const [customer, setCustomer] = useState({ id: 4, name: 'David' }); // example logged-in user

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Bank Lending System</h1>
      {/* <p>Logged in as: {customer.name}</p>
      <LoanForm customer_id={customer.id} />
      <PaymentForm /> */}
      <Login />
    </div>
  );
}
