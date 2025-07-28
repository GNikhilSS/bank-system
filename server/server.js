const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create/Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');

        // Create tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_code TEXT UNIQUE NOT NULL,  -- unique customer identifier
            name TEXT UNIQUE NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            principal REAL NOT NULL,
            total_amount REAL NOT NULL,
            monthly_emi REAL NOT NULL,
            amount_paid REAL DEFAULT 0,
            emis_left INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_type TEXT NOT NULL,
            remaining_balance REAL,
            emis_left INTEGER,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id) REFERENCES loans (id)
        )`);

        const preloadCustomers = `
            INSERT OR IGNORE INTO customers (customer_code, name) VALUES
            ('CUST001', 'Alice'),
            ('CUST002', 'Bob'),
            ('CUST003', 'Charlie');
        `;

        db.run(preloadCustomers, (err) => {
            if (err) {
                console.error('Error preloading customers:', err.message);
            } else {
                console.log('✅ Default customers preloaded');
            }
        });
    }
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date() });
});

// LEND - Apply for loan
app.post('/api/loans', (req, res) => {
    const { loan_amount, loan_period_years, interest_rate } = req.body;
    // Always use Alice's ID
    const aliceId = 1;
    if (!loan_amount || !loan_period_years || !interest_rate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const principal = parseFloat(loan_amount);
    const years = parseInt(loan_period_years, 10);
    const rate = parseFloat(interest_rate);
    const interest = principal * years * (rate / 100);
    const total_amount = principal + interest;
    const monthly_emi = total_amount / (years * 12);
    const emis_left = years * 12;

    const query = `INSERT INTO loans (customer_id, principal, total_amount, monthly_emi, emis_left)
                   VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [aliceId, principal, total_amount, monthly_emi, emis_left], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create loan: ' + err.message });
        }
        res.status(201).json({
            loan_id: this.lastID,
            customer_id: aliceId,
            total_amount,
            monthly_emi,
            message: 'Loan created successfully!'
        });
    });
});

// PAYMENT - Make a payment for a loan
app.post('/api/loans/:loan_id/payment', (req, res) => {
  const loan_id = parseInt(req.params.loan_id);
  const { amount, payment_type } = req.body;

  if (!amount || !payment_type) {
    return res.status(400).json({ error: 'Both amount and payment_type are required' });
  }

  if (payment_type !== 'EMI' && payment_type !== 'LUMP_SUM') {
    return res.status(400).json({ error: 'payment_type must be either "EMI" or "LUMP_SUM"' });
  }

  db.get('SELECT * FROM loans WHERE id = ? AND status = "ACTIVE"', [loan_id], (err, loan) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or is closed' });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const minPayment = loan.monthly_emi;
    const maxPayment = loan.total_amount - loan.amount_paid;

    // Enforce minimum EMI for EMI payments (except last payment, which can be less)
    if (payment_type === 'EMI') {
      if (maxPayment >= minPayment && paymentAmount < minPayment) {
        return res.status(400).json({ error: `Minimum EMI payment is ₹${minPayment.toFixed(2)}` });
      }
      // If final payment (less than EMI left), amount must exactly equal remaining
      if (maxPayment < minPayment && paymentAmount !== maxPayment) {
        return res.status(400).json({ error: `Final EMI payment must exactly match remaining balance of ₹${maxPayment.toFixed(2)}` });
      }
    }

    // Prevent paying more than remaining balance
    if (paymentAmount > maxPayment) {
      return res.status(400).json({ error: `Cannot pay more than remaining balance of ₹${maxPayment.toFixed(2)}` });
    }

    const newAmountPaid = loan.amount_paid + paymentAmount;
    let remainingBalance = loan.total_amount - newAmountPaid;
    if (remainingBalance < 0) remainingBalance = 0;

    let newEmisLeft = loan.emis_left;
    if (payment_type === 'LUMP_SUM') {
      newEmisLeft = Math.ceil(remainingBalance / loan.monthly_emi);
    } else if (payment_type === 'EMI') {
      newEmisLeft = Math.max(loan.emis_left - 1, 0);
    }

    const paymentQuery = `INSERT INTO payments (loan_id, amount, payment_type, remaining_balance, emis_left)
                          VALUES (?, ?, ?, ?, ?)`;

    db.run(paymentQuery, [loan_id, paymentAmount, payment_type, remainingBalance, newEmisLeft], function (paymentErr) {
      if (paymentErr) {
        return res.status(500).json({ error: 'Failed to record payment: ' + paymentErr.message });
      }

      const updateLoanQuery = `UPDATE loans SET amount_paid = ?, emis_left = ? WHERE id = ?`;

      db.run(updateLoanQuery, [newAmountPaid, newEmisLeft, loan_id], function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update loan: ' + updateErr.message });
        }

        if (newEmisLeft === 0 || remainingBalance <= 0) {
          db.run('UPDATE loans SET status = ? WHERE id = ?', ['CLOSED', loan_id], (statusErr) => {
            if (statusErr) {
              console.error('Failed to close loan:', statusErr.message);
            }
            return res.json({
              payment_id: this.lastID,
              loan_id,
              remaining_balance: remainingBalance,
              emis_left: newEmisLeft,
              message: 'Payment recorded successfully! Loan is now CLOSED.'
            });
          });
        } else {
          return res.json({
            payment_id: this.lastID,
            loan_id,
            remaining_balance: remainingBalance,
            emis_left: newEmisLeft,
            message: 'Payment recorded successfully!'
          });
        }
      });
    });
  });
});

// LEDGER - Get all transactions and loan details by loan_id
app.get('/api/loans/:loan_id/ledger', (req, res) => {
    const loan_id = parseInt(req.params.loan_id);

    // Fetch loan details
    db.get(`SELECT loans.*, customers.customer_code, customers.name
            FROM loans
            JOIN customers ON loans.customer_id = customers.id
            WHERE loans.id = ?`, [loan_id], (err, loan) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        if (!loan) {
            return res.status(404).json({ error: 'Loan closed or not found' });
        }

        // Fetch all payments for this loan ordered by most recent first
        db.all(`SELECT id as payment_id, amount, payment_type, remaining_balance, emis_left, payment_date
                FROM payments
                WHERE loan_id = ?
                ORDER BY payment_date DESC`, [loan_id], (err2, payments) => {
            if (err2) {
                return res.status(500).json({ error: 'Database error: ' + err2.message });
            }

            const balance_amount = loan.total_amount - loan.amount_paid;

            res.json({
                loan_id: loan.id,
                customer_code: loan.customer_code,
                customer_name: loan.name,
                principal: loan.principal,
                total_amount: loan.total_amount,
                monthly_emi: loan.monthly_emi,
                amount_paid: loan.amount_paid,
                balance_amount: balance_amount,
                emis_left: loan.emis_left,
                status: loan.status,
                transactions: payments
            });
        });
    });
});

// ACCOUNT OVERVIEW - List all loans for a customer
app.get('/api/customers/:customer_id/overview', (req, res) => {
    const customer_id = parseInt(req.params.customer_id);

    // Validate input
    if (!customer_id || isNaN(customer_id)) {
        return res.status(400).json({ error: 'Valid customer_id is required' });
    }

    // Fetch loans for the customer
    db.all('SELECT * FROM loans WHERE customer_id = ?', [customer_id], (err, loans) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        // Construct overview response
        const overview = {
            customer_id: customer_id,
            total_loans: loans.length,
            loans: loans.map(loan => ({
                loan_id: loan.id,
                principal: loan.principal,
                total_amount: loan.total_amount,
                total_interest: loan.total_amount - loan.principal,
                emi_amount: loan.monthly_emi,
                amount_paid: loan.amount_paid,
                emis_left: loan.emis_left,
                status: loan.status
            }))
        };

        res.json(overview);
    });
});

// CREATE ACCOUNT - Register a new customer
// const generateCustomerCode = (name) => {
//     // Simple example: use first 3 letters uppercase + timestamp 
//     // You can enhance this with better code generation logic
//     const prefix = name.trim().substring(0, 3).toUpperCase();
//     const uniqueSuffix = Date.now().toString().slice(-5); // last 5 digits of timestamp
//     return prefix + uniqueSuffix;
// };

// app.post('/api/customers', (req, res) => {
//     const { name } = req.body;

//     if (!name || !name.trim()) {
//         return res.status(400).json({ error: 'Name is required' });
//     }

//     // Check if customer with same name exists (optional: or enforce unique names)
//     db.get('SELECT id, customer_code FROM customers WHERE name = ?', [name.trim()], (err, row) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (row) {
//             return res.status(409).json({
//                 error: 'Customer with this name already exists',
//                 customer: { id: row.id, customer_code: row.customer_code, name }
//             });
//         }

//         const customer_code = generateCustomerCode(name);

//         db.run(
//             'INSERT INTO customers (customer_code, name) VALUES (?, ?)',
//             [customer_code, name.trim()],
//             function (err2) {
//                 if (err2) return res.status(500).json({ error: err2.message });

//                 res.status(201).json({
//                     message: 'Account created successfully',
//                     customer: { id: this.lastID, customer_code, name: name.trim() },
//                 });
//             }
//         );
//     });
// });


// Get all customers

app.get('/api/customers', (req, res) => {
    db.all('SELECT name FROM customers', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'No customers ' });
        res.json(row);
    })
})


// Get customer by numeric ID
// app.get('/api/customers/id/:id', (req, res) => {
//     const id = parseInt(req.params.id);

//     if (isNaN(id)) {
//         return res.status(400).json({ error: 'Invalid customer ID' });
//     }

//     db.get('SELECT id, customer_code, name FROM customers WHERE id = ?', [id], (err, row) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (!row) return res.status(404).json({ error: 'Customer not found' });
//         res.json(row);
//     });
// });


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
