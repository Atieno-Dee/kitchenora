// Safaricom Daraja helper. Credentials come ONLY from environment variables.
const base = () => process.env.DARAJA_ENV === 'production'
  ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

const REQUIRED = ['DARAJA_CONSUMER_KEY','DARAJA_CONSUMER_SECRET','DARAJA_SHORTCODE','DARAJA_PASSKEY','DARAJA_CALLBACK_URL'];
const missing = () => REQUIRED.filter(k => !process.env[k]);

async function getToken() {
  const auth = Buffer.from(process.env.DARAJA_CONSUMER_KEY + ':' + process.env.DARAJA_CONSUMER_SECRET).toString('base64');
  const r = await fetch(base() + '/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: 'Basic ' + auth } });
  if (!r.ok) throw new Error('Daraja auth failed: ' + r.status);
  return (await r.json()).access_token;
}

async function stkPush({ phone, amount, ref }) {
  const token = await getToken();
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const shortcode = process.env.DARAJA_SHORTCODE;
  const password = Buffer.from(shortcode + process.env.DARAJA_PASSKEY + ts).toString('base64');
  const r = await fetch(base() + '/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode, Password: password, Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline', Amount: Math.round(amount),
      PartyA: phone, PartyB: shortcode, PhoneNumber: phone,
      CallBackURL: process.env.DARAJA_CALLBACK_URL,
      AccountReference: ref, TransactionDesc: 'Kitchenora order'
    })
  });
  return r.json();
}
module.exports = { missing, getToken, stkPush };
