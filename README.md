# Kitchenora - Everything your kitchen needs.
Kenyan kitchenware store: HTML, CSS, JavaScript, Node.js, Express. English + Kiswahili. M-Pesa (Daraja STK Push) ready.

## Run
`npm install` then `npm start`, open http://localhost:3000 (Node 18+).

## Structure
- `public/` pages, `css/style.css`, `js/products.js` (catalogue), `js/app.js` (cart, language, checkout), `images/` (placeholder SVGs: replace with real photos and update `image` in products.js)
- `server/server.js` routes, `server/daraja.js` Daraja auth + STK Push

## M-Pesa setup (do this when you have credentials)
1. Register at developer.safaricom.co.ke, create an app, get Consumer Key, Consumer Secret, Shortcode, Passkey (sandbox: shortcode 174379).
2. Copy `.env.example` to `.env` and fill in every value (or set them as environment variables on your host). Never put them in frontend code or commit `.env`.
3. Set `DARAJA_CALLBACK_URL` to `https://<your-public-domain>/api/mpesa/callback` (must be public HTTPS).
4. Open `/api/mpesa/auth-test` -> should return `{"ok":true}`, then test checkout with a sandbox phone number.

## Status
Frontend, catalogue, cart, language switching and checkout form are built. **Live M-Pesa has NOT been tested**: it needs real Daraja credentials. Until then checkout shows "M-Pesa is not configured yet".
Routes: `POST /api/mpesa/stkpush`, `POST /api/mpesa/callback`, `GET /api/mpesa/status/:id`, `GET /api/mpesa/auth-test`.
Note: payment status is stored in memory (resets on restart); use a database for production. Product names/descriptions are English only.

## Photos
Photos are in `public/images/` (cookware, utensils, tableware, storage, hero-kitchen). Each product points to one in `public/js/products.js` (`image` field); add more photos and change the path to give each product its own picture.
