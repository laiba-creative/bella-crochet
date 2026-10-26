# Security and operations

## Trust boundaries

The public website reads only published catalogue rows. It does not register customers, collect payment details, expose an order lookup or accept unauthenticated customer-data writes. Orders and support records are created manually by an authorised administrator after WhatsApp confirmation. The business number is public by design.

Supabase validates signed bearer tokens before database requests. The actual database policies use `auth.uid()` and the token's AAL claim together with a live owner-maintained membership table and a verified TOTP factor. Client state, role fields, hidden links and local storage do not grant permissions. The UI route guard improves usability; it is not the enforcement boundary.

## Implemented controls

- Private admin membership table in the non-exposed `private` schema; no privileges or policies permit ordinary users to access or edit it.
- MFA `aal2`, active membership and a live verified TOTP factor are required for private reads and all administrative writes, including image uploads. Password-only admin sessions cannot access records.
- Explicit table privileges plus RLS on catalogue, orders, support, settings and audit tables. Public visitors cannot read customer or admin records; authenticated non-admins see no private rows.
- Separate public catalogue and private orders/support/settings. No private file upload bucket exists. Product image storage is public and must never contain private files.
- Database constraints for prices, stock, identifiers, field lengths, JSON order items and image locations. Image uploads are limited to JPG/PNG/WebP, 5 MB by bucket configuration, and product-only paths. Browser processing strips metadata and resizes/re-encodes selected photos; this processing is usability/privacy hygiene, not a replacement for storage policies. No malware-scanning service is integrated; only authorised admins can upload, and the bucket disallows active document formats such as SVG/HTML.
- React text escaping, encoded WhatsApp parameters, fixed WhatsApp destination, no `dangerouslySetInnerHTML`, no arbitrary iframe or redirect URL inputs.
- Memory-only admin session tokens; no persisted password or admin token. UI inactivity signout at 15 minutes and absolute UI session at 8 hours. **These UI timers are not server token-revocation controls.** Provider token expiry/revocation must also be configured below. Deactivating membership blocks database access immediately, including for a still-valid token.
- Customer note stays in tab memory, not persistent cart storage. Clearing the cart removes saved product choices. No analytics, AI SDK, remote fonts, raw auth/error logging or third-party customer-data telemetry is integrated.
- Metadata-only audit events with append protection from browser roles. It is not an immutable external audit store; project owners can administer it.
- Vercel config includes CSP, no framing, no-referrer, nosniff, restrictive permissions, HSTS and admin no-store/noindex. Verify actual deployed responses; local Vite does not apply Vercel headers. CSP's style `unsafe-inline` supports image-independent React UI styles; scripts do not allow `unsafe-inline` or `unsafe-eval` in production.

## Required owner configuration before launch

1. Secure the Supabase and Vercel owner accounts with MFA and restrict team membership. Keep recovery codes offline. Review access to the GitHub repository.
2. Disable Supabase public signup and anonymous sign-ins; enable only the email/password flow needed for invited admins. Disable unused providers. There is no public signup UI, but provider configuration must disable its API too.
3. Require strong unique admin passwords (at least 16 characters); enable compromised-password checks if your provider plan supports them. Never weaken password controls for setup.
4. Enable TOTP enrolment and verification; keep both enabled. Membership is granted only by the owner SQL shown in README. Do not use editable user metadata for roles.
5. Set JWT expiry to a short supported duration (for example 10 minutes); enable refresh-token rotation and use the provider's session limits where available. A client logout cannot instantly invalidate every already issued bearer token. For immediate access revocation, deactivate membership first.
6. Review Supabase Auth rate limits, signup restrictions and abuse controls for your project/plan. Tighten email/password and verification limits to your staff's needs. Enable supported bot protection when available; this package does not claim CAPTCHA, custom WAF or server-side per-IP rate limiting has been provisioned.
7. Expose only the needed API schemas (normally `public`, with Storage managed separately); never expose `private` or `auth`. Confirm RLS and grants after every migration. Do not add a permissive policy to make an error disappear.
8. Review URL allowlists, HTTPS and exact deployment domains. Narrow the `*.supabase.co` hosts in `vercel.json` to your actual project origin if desired; update both image and connection rules. Keep `frame-ancestors 'none'`, `object-src 'none'` and script restrictions.
9. Use distinct staging and production projects. No production customer records in tests, previews, screenshots or AI prompts. Disable sensitive provider request-payload logging where configurable; provider operational logs still process technical request metadata needed to run the service.
10. Configure and test provider backup/restore arrangements for your plan. Database backup and product image backup are separate concerns. No custom backup service is silently provisioned here.

## Recovery and revocation

The account owner should create/recover accounts through Supabase's authenticated management dashboard, not through a public application role editor. For lost authenticators, verify the administrator out of band, then deactivate membership **before** resetting credentials or MFA:

```sql
update private.admin_members set active=false
where user_id='ADMIN-UUID';
```

Recover the account using Supabase owner controls, revoke sessions and remove compromised factors through the provider; re-enable membership only after the owner's identity check, then re-enrol TOTP. Keep recovery arrangements separate from the website. This requires the project owner's privileged account and must not be exposed as a customer API.

## Retention and customer rights

Record only the name, necessary contact, order items/quote and fulfilment details required for business operations. Support notes should summarise the issue rather than copy whole conversations. The dashboard's retention action deletes completed/cancelled orders unchanged for 180 days and closed support records unchanged for 90 days, after explicit confirmation that no legitimate longer-retention requirement applies. This is a manual maintenance action, not a scheduled deletion guarantee. Run monthly and retain a minimal operational record of completion. Review audit-event retention separately. WhatsApp retention is controlled outside this application.

The owner must handle verified correction/deletion requests, including copies in WhatsApp, exports and backups under their retention process. No customer exports are implemented in this package.

## Security verification

Run `npm test`, then complete the following in a synthetic staging project:

- Anonymous catalogue can read published pieces; hidden pieces and hidden categories do not appear.
- Anonymous and ordinary authenticated users cannot read or mutate orders/support/settings/audit, write products/categories or upload storage objects. A fake bearer token is rejected.
- An owner-approved administrator at AAL1 cannot read private rows or write any admin resource.
- Enrolment QR is private; wrong codes fail; correct TOTP upgrades to AAL2 and enables dashboard operations. Signing out removes records from the interface.
- Edit/add/hide a product; verify the public catalogue from a separate signed-out browser. Upload a valid public image; reject SVG/HTML, oversize uploads and attempts to upload outside the product path.
- Deactivate membership while the admin still has a session: subsequent data/API writes must fail. Verify removal of TOTP also denies private access for a stale AAL2 session.
- Use a second ordinary test identity to attempt direct API access to a synthetic private order. No row contents should be returned.
- Inspect deployed security headers, direct-link routing, browser console and network destinations. Ensure no secrets enter the generated JS or source maps.
- Test restoration of non-production backups and the retention action using synthetic historical records.

The supplied hosted smoke script covers a subset. Provider configurations and a full deployed MFA/storage flow remain **unverified until run against your configured project**. No claim of complete security or immunity to attacks is made.

## Maintenance

Review dependencies and `npm audit` before launch and monthly. Apply patches in staging, run tests and rebuild before production. Verify lockfile changes. Review provider access logs and admin activity without sending customer contents to other services. Remove unused admin memberships. Delete unreferenced public product photos through the authenticated Storage dashboard after checking product references. Rotate compromised credentials, deactivate affected membership and investigate exposure if an incident is suspected.

## Official references

- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://vercel.com/docs/frameworks/frontend/vite
