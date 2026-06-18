# PlayBeat Digital — v3.0 (React Storefront + Admin)

Full-stack digital goods store: Express + MongoDB API, React (Vite) storefront and admin
panel. Games, AI tools, software, gift cards, subscriptions and top-ups, with instant
delivery and PKR pricing.

## What's in this version

- **`client/`** — the React storefront + admin app (new). See `client/README.md` for details.
  This replaces the old static pages that used to live in `public/*.html`.
- Everything else (API, models, payment gateway integrations, email service) is unchanged
  from v2.0 — the React app is a frontend layer on top of the same backend contract.

## Quick start

### 1. Install API dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Stripe keys, etc.
```

### 3. Build the React client
```bash
cd client
npm install
npm run build
cd ..
```

### 4. Run
```bash
# Development (API only — run `npm run dev` inside client/ separately for hot reload)
npm run dev

# Production (Express serves the built client + the API on one origin)
npm start
```

Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the
admin panel (default password `playbeat2025`, or whatever you set as `ADMIN_PASSWORD`).

### Local development with hot reload

Run the API and the client dev server side by side:
```bash
npm run dev                       # API on :3000
cd client && npm run dev          # Vite dev server on :5173, proxies to :3000 via VITE_API_URL
```
See `client/.env.example` for the `VITE_API_URL` setting.

---

## File Structure
```
playbeat/
├── server.js                  ← Main entry point — serves client/dist + the API, SPA fallback
├── package.json               ← API dependencies
├── .env.example                ← Environment template
│
├── client/                    ← React storefront + admin (NEW — see client/README.md)
│   ├── src/
│   │   ├── api/                one module per backend route group
│   │   ├── context/             Auth, Cart, Settings
│   │   ├── components/          shared UI + admin widgets
│   │   ├── layouts/              Storefront / Account / Admin shells
│   │   └── pages/                storefront/* and admin/* route pages
│   └── dist/                   ← production build output (served by server.js)
│
├── models/
│   └── index.js                ← User, Order, Transaction, Coupon models
│
├── middleware/
│   └── auth.js                 ← JWT + session auth middleware
│
├── routes/
│   ├── auth.js                 ← Register, login, verify, reset password
│   ├── orders.js                ← Create + manage orders
│   ├── payments.js              ← Payment methods API + callbacks
│   ├── products.js              ← Public product API
│   ├── admin.js                 ← Admin CRUD + gateway config + orders
│   └── webhooks.js              ← Stripe + JazzCash webhooks
│
├── services/
│   ├── payments.js              ← Gateway logic (Stripe, JazzCash, etc.)
│   ├── products.js              ← JSON product store helpers
│   └── mailer.js                ← Transactional email service
│
├── data/
│   └── products.json            ← Product catalog
│
└── public/                     ← static assets only (payment gateway logos, etc.)
```

---

## Admin Panel: Payment Gateways

1. Log into `/admin`
2. Navigate to **Payment gateways**
3. Click **Configure** on any gateway
4. Enter credentials → **Save configuration**
5. Click **Test connection** to verify
6. Toggle enabled/disabled per gateway

> All credentials are stored server-side in MongoDB. The frontend never sees API keys,
> merchant IDs, or secrets — only gateway names and enabled state.

---

## Stripe Setup

1. Get keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY` in `.env`
3. Set up a webhook endpoint in the Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## Local Payment Gateways

### JazzCash
- Get credentials from the JazzCash merchant portal
- Configure in Admin → Payment gateways → JazzCash

### Bank Alfalah
- Contact Bank Alfalah for a merchant account
- Configure channel ID, merchant ID, store ID in the admin panel

### Meezan Bank
- Manual IBAN transfer to: `PK86MEZN0015040115102971`
- Customers submit transfer proof at checkout
- Admin verifies and marks the order as paid

---

## Security Notes
- Rotate all keys shown in setup messages
- Use HTTPS in production (required for cookies + Stripe)
- Set `NODE_ENV=production` in production
- MongoDB Atlas: whitelist only your server IP
- Never commit `.env` to git (it's in `.gitignore`)
