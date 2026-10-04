require('dotenv').config();
const express = require('express');
const path = require('path');
const daraja = require('./daraja');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const payments = {}; // CheckoutRequestID -> { status, message, receipt }  (in-memory; use a DB in production)

// Converts 07xx / 01xx / +254... to 2547XXXXXXXX
const normPhone = p => {
  p = String(p || '').replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(p)) p = '254' + p.slice(1);
  return /^254[17]\d{8}$/.test(p) ? p : null;
};

// STK Push: called by the checkout page
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { name, email, address, phone, amount, items } = req.body;
  const msisdn = normPhone(phone);
  if (!name || !email || !address) return res.status(400).json({ error: 'Please fill in all checkout fields.' });
  if (!msisdn) return res.status(400).json({ error: 'Enter a valid Safaricom M-Pesa number, e.g. 0712345678.' });
  if (!(amount > 0)) return res.status(400).json({ error: 'Your cart is empty.' });
  const miss = daraja.missing();
  if (miss.length) {
    console.warn('M-Pesa not configured. Missing env vars: ' + miss.join(', '));
    return res.status(503).json({ error: 'unavailable' });
  }
  const orderRef = 'KN' + Date.now().toString().slice(-8);
  try {
    const d = await daraja.stkPush({ phone: msisdn, amount, ref: orderRef });
    if (d.ResponseCode !== '0') return res.status(502).json({ error: d.errorMessage || d.ResponseDescription || 'Could not send the M-Pesa prompt. Please try again.' });
    payments[d.CheckoutRequestID] = { status: 'PENDING', orderRef, order: { name, email, address, phone: msisdn, amount, items } };
    res.json({ checkoutRequestId: d.CheckoutRequestID, orderRef });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not reach M-Pesa. Please try again.' }); }
});

// Callback: Safaricom posts the payment result here
app.post('/api/mpesa/callback', (req, res) => {
  const cb = req.body && req.body.Body && req.body.Body.stkCallback;
  if (cb) {
    const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
    const receipt = (items.find(i => i.Name === 'MpesaReceiptNumber') || {}).Value;
    payments[cb.CheckoutRequestID] = { ...(payments[cb.CheckoutRequestID] || {}), status: cb.ResultCode === 0 ? 'SUCCESS' : 'FAILED', message: cb.ResultDesc, receipt };
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Status: checkout page polls this
app.get('/api/mpesa/status/:id', (req, res) => { const p = payments[req.params.id]; res.json(p ? { status: p.status, message: p.message, receipt: p.receipt, orderRef: p.orderRef } : { status: 'UNKNOWN' }); });

// Optional: test Daraja authentication (no secrets returned)
app.get('/api/mpesa/auth-test', async (req, res) => {
  const miss = daraja.missing();
  if (miss.length) return res.status(503).json({ ok: false, missing: miss });
  try { await daraja.getToken(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Kitchenora running on port ' + PORT));
