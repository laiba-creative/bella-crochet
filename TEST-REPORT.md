# Verification report

Checked locally on 24 October 2026. This report describes executed checks, not a security certification.

## Passed

- `npm run build`: production Vite build completed successfully, including the separately loaded admin interface.
- `npm test`: 24 tests passed, zero failures. Includes 18 database policy tests, four cart/WhatsApp tests and two checks that private Supabase key formats are rejected by build configuration.
- Database tests execute the supplied migration and seed in PGlite PostgreSQL with synthetic Auth/Storage schemas. They check public catalogue restrictions; anonymous and ordinary-user private-data isolation; attempted role escalation; AAL1 denial; verified AAL2 admin access; immediate membership revocation; removed-factor denial; product constraints; storage permissions; audit metadata and settings permissions; and RLS enabled on application tables.
- Cart tests cover encoded WhatsApp messages, bounded quantities/notes, separation of variants and the exclusion of notes from persistent cart storage.
- `npm audit`: zero reported vulnerabilities in the installed dependency tree at the time checked. This is a point-in-time dependency advisory check, not proof that dependencies have no vulnerabilities.

## Browser checks

Desktop browser checks covered the homepage layout and video area, All Products, category filtering, the Star Keychain page, colour/custom-size/quantity selection, adding to the bag, the global bag count, the story page and the unconfigured admin screen.

A synthetic two-item request with Pink / Custom size and a 12 cm/bow note produced the expected encoded WhatsApp link to the configured business number. No WhatsApp message was sent. Refresh retained product selections without retaining the note; the cart withheld ordering for the custom selection until a new note was entered.

The unconfigured admin screen offered setup instructions and no demo login or private data. During development, browser-extension metadata errors and a React duplicate-root warning after hot reload were observed; these were development-session messages, not a production browser verification. Mobile layout rules are included but a separate mobile-device test was not performed.

## Still required before production

No live Supabase project, admin credentials or deployment were supplied. Therefore hosted Auth/MFA enrolment and recovery, real JWT issuance/expiry, Storage service behaviour, provider rate limits, email delivery, backup restoration, Vercel response headers and authenticated admin CRUD were **not** verified end to end.

The PostgreSQL tests use synthetic claims and provider-schema fixtures. They verify the application SQL policies, not Supabase's actual identity-provider implementation. Follow `SECURITY.md`, run `npm run test:hosted` against staging and manually verify the complete admin MFA and business-management flows with synthetic data before using customer information.

Confirm all sample PKR prices, product dimensions, colour availability, delivery terms, Instagram URL and final hero video with the owner before launch. Orders and support cases are recorded manually after WhatsApp confirmation; this package does not integrate with the WhatsApp inbox or collect payments.
