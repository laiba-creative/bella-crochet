# Bella Crochet

A React + Vite storefront and private Supabase administration workspace. The design follows Laiba's approved white, cream, sky-blue and pink layout. Includes the ten supplied product photographs, the supplied SVG logo and a replaceable six-second hero video made from the owl-pouch photograph.

**Start here:** the storefront runs immediately using a local sample catalogue. **The admin dashboard needs your own Supabase project, owner-approved account and MFA.** There is no hardcoded admin password or local-storage admin bypass. This package has not been deployed and is not connected to a live database.

## 1 Open it in VS Code

1. Extract `bella-crochet.zip` first. Do not open files directly from the ZIP.
2. Install Node.js **22.12 or newer** (a supported LTS release is recommended).
3. In VS Code choose **File → Open Folder → bella-crochet**.
4. Open **Terminal → New Terminal** and run:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open the Local URL printed by Vite. On macOS/Linux use `cp .env.example .env` instead of Copy-Item. Initially leave both Supabase values blank. `/admin` explains that setup is required. After connecting Supabase, the website uses that database and will report failures rather than silently substitute local data.

## 2 Project map

| Path                                 | Purpose                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `src/pages/Home.jsx`                 | Approved video, text-below-video, featured pieces, story and ordering sections                  |
| `src/pages/Products.jsx`             | All products and category filters; no separate Collection page                                  |
| `src/pages/ProductDetails.jsx`       | Colour, size, quantity, custom request, note and WhatsApp actions                               |
| `src/pages/Cart.jsx`                 | Persistent product selections, editable notes and combined WhatsApp request                     |
| `src/pages/OurStory.jsx`             | Brand story                                                                                     |
| `src/pages/Help.jsx`                 | Help and privacy notices                                                                        |
| `src/pages/Admin.jsx`                | Login, TOTP enrolment/challenge, products, categories, orders, support, settings and audit view |
| `src/components/Layout.jsx`          | Shared navbar, Collection dropdown, cart badge and taller footer                                |
| `src/context/ShopContext.jsx`        | Catalogue loading and cart state                                                                |
| `src/services/`                      | Supabase client, catalogue queries, admin operations and sample product data                    |
| `src/utils/shop.js`                  | WhatsApp number, message generation, quantity bounds and note handling                          |
| `src/styles/`                        | Storefront and admin CSS                                                                        |
| `public/images/products/`            | Optimised copies of your ten product photos                                                     |
| `public/images/logo.svg`             | Your supplied final logo                                                                        |
| `public/videos/hero-placeholder.mp4` | Replace this file with your final hero video                                                    |
| `supabase/migrations/001_bella.sql`  | Database tables, constraints, private admin membership, RLS and storage policies                |
| `supabase/seed.sql`                  | Ten sample products, editable PKR prices and four categories                                    |
| `tests/`                             | Executable PostgreSQL policy tests and WhatsApp/cart tests                                      |
| `SECURITY.md`                        | Security design, owner setup, recovery, maintenance and verification limits                     |
| `vercel.json`                        | SPA routing and deployment security headers                                                     |

`npm run format` formats editable code; `npm run build` checks and builds production assets; `npm test` runs automated tests. `node_modules` and `dist` are deliberately not included in the ZIP.

## 3 Connect a real Supabase database

Use a separate **staging project with synthetic data** before production.

1. Create your Supabase project in your own account. Keep the database password private.
2. Open its **SQL Editor** as the project owner. Run all of `supabase/migrations/001_bella.sql` on a fresh project. It runs in a transaction; if it fails, resolve the error before continuing. Do not disable RLS to fix an error.
3. Run `supabase/seed.sql` once. These prices are samples, not a market valuation or confirmed selling prices. Each item is initially made to order and offers the colour presets and sizes plus custom options. The photos show the original colour; they do not recolour when an option changes.
4. In **Authentication**, disable public signups. Enable TOTP MFA. Configure the provider controls listed in SECURITY.md.
5. Create the owner's admin user through **Authentication → Users** using your own email and a strong unique password of at least 16 characters. Do not send the password in chat or commit it to Git.
6. Copy that user's UUID from the Supabase dashboard. In owner-only SQL Editor run this, replacing the placeholder with the actual UUID:

```sql
insert into private.admin_members(user_id)
values ('REPLACE-WITH-ADMIN-USER-UUID');
```

This owner-only database operation is the only way this application grants admin membership. Do not add a user-facing signup or role-edit form.

7. In your local `.env` set the project URL and **publishable key** (or legacy `anon` key):

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
VITE_INSTAGRAM_URL=
```

The publishable/anon key is intended to be public and is protected by the database policies. **Never use a `service_role`, `sb_secret_`, database password or JWT signing secret here.** The build rejects recognised private-key formats assigned to the publishable variable, but you must still review configuration.

8. Restart `npm run dev`. Open `/admin`, sign in, select **Set up authenticator**, scan the QR code with your authenticator app and verify the current code. You cannot open private records before completing MFA.
9. Upload a synthetic product image and test editing/hiding a sample product. Do not place customer records in staging.

## 4 Manage the business

- **Products:** Add a name, unique lowercase ID, category, price, description and at least one image. Set colours and sizes as comma-separated options. Publish when ready. The first image is the cover. Move a piece to another category using its dropdown. Prices are base prices; custom changes need a quote.
- **Stock:** Choose ready stock and quantity, or made to order. Sending a WhatsApp request does not reserve or decrement stock. Update it after confirming an order. Any small/medium/large dimensions must be confirmed with the customer until you enter actual specifications.
- **Categories:** Add, rename or hide categories. Hiding a category hides its products for public visitors. A category that still contains products cannot be deleted: move its products first.
- **Orders:** Manually record an order confirmed on WhatsApp. Add products, quantities, agreed selections and final amount, then update fulfilment status. This is not automated WhatsApp inbox integration and does not prove a payment was received.
- **Customer support:** Record a minimal summary, necessary contact and next action. This is an internal case log, not a public chat widget or automatic message sender.
- **Settings:** Internal business preferences and retention action. Admin membership is owner-managed SQL, not an editable browser role. Public business contacts remain in code/environment.
- **Access & activity:** Audit metadata records actor UUID, resource, record ID, action and time, without copying order contents or support notes.

## 5 Contacts and personalisation

- WhatsApp is already set to **+92 331 4544497** in `src/utils/shop.js`.
- Add the owner's actual Instagram URL to `VITE_INSTAGRAM_URL`. It is intentionally not linked to a made-up profile.
- Footer designer credit links to `https://laibafayazportfolio.vercel.app/`. Hover/focus shows the notice; clicking opens the portfolio in a new tab.
- Replace `public/videos/hero-placeholder.mp4` with your MP4 at the same path. Use a muted, compressed landscape clip and keep `playsInline`. The owl image remains the poster if autoplay is restricted. A pause control is included; reduced-motion visitors do not autoplay.
- Replace any product cover through the admin editor once connected. Static starting photos remain in the project folder for future deploys.
- Fonts are served locally; their licence is in `public/fonts/LICENSE.txt`. No remote font or analytics requests are used.

## 6 Deploy yourself to Vercel

First complete SECURITY.md's staging verification. Then:

```powershell
npm run build
npm test
git init
git add .
git commit -m "Build Bella Crochet storefront and private admin"
git branch -M main
git remote add origin YOUR-GITHUB-REPOSITORY-URL
git push -u origin main
```

Before `git add`, ensure `.env` is ignored (`git check-ignore .env`). Create a Vercel project from your repository, choose **Vite**, build command `npm run build`, output directory `dist`. Add the public `VITE_` variables to the appropriate Vercel environments. Production must use the production project; previews should use staging, never production customer data. Redeploy after environment changes.

Vercel's assigned address is enough; a custom domain is optional. Update Supabase Site URL to the production HTTPS address and allow only the exact recovery URLs you intend to use. Verify `/products/star` and `/admin` open directly, HTTPS/security headers, and the full staging MFA flow. A build passing is not a live security certification.

## 7 Checks and remaining setup

See `TEST-REPORT.md` for exactly what was executed. The PostgreSQL tests run the actual migration against PGlite with synthetic Auth/Storage schemas and role claims. They do **not** replace staging tests of Supabase Auth, MFA, Storage, provider rate limits or Vercel headers.

To run read-only hosted checks, provide a **staging** project URL, publishable key and optionally synthetic admin credentials/current TOTP code through local environment variables, then run `npm run test:hosted`. Never commit these values or paste them into a chat. This script prints only pass/fail summaries. Follow the manual staging checklist too.

No production project, credentials or customer data were supplied, so live provisioning, email delivery, provider settings and hosted security verification remain yours to complete with this guide. The code is delivered in full; those external account steps cannot be preconfigured inside a ZIP.
