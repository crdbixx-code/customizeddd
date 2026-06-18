# playbeat — React Storefront + Admin

A full React (Vite) frontend for the PlayBeat Digital backend: customer storefront, cart,
checkout (Stripe, JazzCash, EasyPaisa, Bank Alfalah, Meezan, direct bank transfer), account
area, and a complete admin panel (products, categories, orders, transactions, coupons,
customers, payment gateway config, site settings).

This app **replaces** the old static HTML pages in `../public`. It talks to the existing
Express API only — no mock data, no duplicated backend logic.

## Stack

- React 18 + React Router 6
- Tailwind CSS (utility classes, dark "console" theme)
- Axios for API calls (JWT bearer token + session cookie, matching the backend's `requireAuth`)
- recharts for the admin dashboard chart
- lucide-react for icons
- react-hot-toast for notifications

## Setup

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL if running the API on a different origin/port
npm run dev             # http://localhost:5173, talks to VITE_API_URL
```

### Building for production

The Express server (`../server.js`) is already wired to serve this app's build output and
fall back to it for any non-`/api` route (SPA routing), so the simplest production setup is:

```bash
cd client
npm install
npm run build            # outputs to client/dist
cd ..
npm start                 # Express serves client/dist + the API on one origin
```

With this setup `VITE_API_URL` should be left **empty** in `.env` (or just delete `.env`) so
the client calls `/api/...` on the same origin it's served from — no CORS configuration needed.

If you'd rather run the client and API as separate origins (e.g. client on a CDN, API on a
separate host), set `VITE_API_URL=https://api.yourdomain.com` at build time and make sure
`ALLOWED_ORIGINS` in the API's `.env` includes the client's origin (cookies are sent with
`withCredentials: true`, so CORS must allow credentials from that exact origin).

## How auth works here

The backend supports two parallel auth mechanisms (see `middleware/auth.js`):
1. **JWT bearer token** — returned from `/api/auth/login` and `/api/auth/register`, stored in
   `localStorage` as `pb_token`, sent as `Authorization: Bearer <token>` on every request.
2. **Session cookie** — set automatically by the same login/register calls (`withCredentials:
   true` makes axios store/send it).

The client relies on the JWT for `useAuth()` (see `src/context/AuthContext.jsx`), so it works
even if cookies are blocked. Admin pages use the legacy session-based `/api/admin/login`
(password-only) and gate routes with a `pb_admin` flag in `sessionStorage` — this matches
`requireAdmin` in the backend, which checks `req.session.isAdmin` first.

## How cart/checkout works

There's no cart API on the backend — `POST /api/orders` accepts the full item list and
re-prices everything server-side from `data/products.json` (the backend never trusts
frontend prices). So the client cart (`src/context/CartContext.jsx`) is just `localStorage`,
and checkout sends `{ productId, qty }` pairs to `/api/orders`.

Order amounts returned by the backend (`subtotal`, `discount`, `total`, `item.price`, etc.) are
stored in **paisa** (PKR × 100) — see `formatPKR(value, { fromPaisa: true })` in
`src/lib/format.js`. Product list/detail prices from `/api/products` are plain rupees, so those
calls use `formatPKR(value)` without the flag. Keeping this straight matters everywhere money
is displayed.

Each payment method redirects differently after `POST /api/orders`:
- **stripe** → `paymentData.sessionUrl`, full-page redirect to Stripe Checkout. The return page
  (`/checkout/return`) reads `?session_id=` and POSTs to `/api/payments/stripe/verify`.
- **jazzcash / easypaisa** → `paymentData.apiUrl` + `paymentData.payload`, submitted as an
  auto-generated hidden form POST (see `submitGatewayForm()` in `Checkout.jsx`) because these
  gateways expect a browser-redirected form submission, not a fetch/XHR call.
- **alfalah** → same shape as jazzcash/easypaisa today; if your Alfalah integration needs a
  different submission shape, adjust `submitGatewayForm` usage in `Checkout.jsx`.
- **meezan / bank_transfer** → `paymentData.type === 'manual_bank'`, no redirect — the client
  shows IBAN/account instructions and a "submit transfer proof" form
  (`POST /api/payments/bank-proof`), which the admin verifies manually from Orders.

## Project structure

```
src/
  api/            one file per backend route group (auth, products, orders, admin) — thin
                   wrappers, no business logic
  context/        AuthContext, CartContext, SettingsContext
  components/     shared building blocks (Navbar, CartDrawer, ProductCard, ui/*, admin/*)
  layouts/        StorefrontLayout, AccountLayout, AdminLayout
  pages/storefront  home, category/search, product detail, login/register, checkout, account
  pages/admin       dashboard, products, categories, orders, transactions, coupons,
                     customers, payment gateways, settings
  lib/            formatting helpers, category/icon metadata
```

## Things you'll likely want to adjust

- **Images**: products currently use `placehold.co` URLs from the seed data
  (`data/products.json`). Swap in real product images via the admin Products page (Image URL
  field) or by editing the JSON directly.
- **Email verification banner**: shown on the account page when `user.emailVerified` is false;
  wired to the real `/api/auth/resend-verification` endpoint.
- **Admin password**: defaults to `playbeat2025` (or `ADMIN_PASSWORD` in the API's `.env`).
  Change it from Admin → Site settings once you're in.
- **Payment gateway credentials**: enter real Stripe/JazzCash/etc. credentials from
  Admin → Payment gateways. They're stored server-side in MongoDB and never sent to the client.
