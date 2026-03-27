# Birdie for Good Platform Notes

This codebase is now structured as a Supabase-first Next.js 16 App Router application.

## Current Stack

- Next.js 16 App Router with Server Components by default
- Server Actions for form-driven mutations
- Route Handlers for Stripe webhooks, proof uploads/downloads, admin draw operations, and scheduled draw publishing
- Supabase Auth for account sessions
- Supabase Postgres for product data
- Supabase Storage for winner proof files
- Stripe for subscription checkout and lifecycle events
- Resend for transactional email delivery
- Vitest for domain/unit coverage
- Playwright scaffolded for browser E2E coverage

## Product Areas

- `app/page.tsx`, `app/charities/*`, `app/how-it-works/page.tsx`: public marketing and discovery
- `app/(auth)/*`: Supabase-backed login and signup
- `app/(app)/dashboard/*`: subscriber dashboard and score/billing flows
- `app/(admin)/admin/*`: admin controls, claims, subscriber management, and audit views
- `app/api/*`: operational route handlers for uploads, webhooks, admin ops, and cron-safe draw publishing

## Supabase Model

The initial schema lives in `supabase/migrations/20260327_initial.sql` and covers:

- profiles
- subscriptions
- charities
- scores
- draws
- winner claims
- notifications
- audit logs

The app seeds the three launch charities into Supabase if the table is empty, and the SQL bootstrap file also inserts them for fresh projects.

## Billing Flow

- Signup creates a Supabase Auth account and provisions the profile/subscription preference in Postgres.
- If Stripe is configured, signup redirects into a subscription checkout session.
- Stripe webhooks update the subscription record back in Supabase.
- If Stripe is not configured yet, the app falls back to admin-managed subscription state so the rest of the product can still be exercised.

## Important Deployment Notes

- The app expects `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for full functionality.
- Proof files are stored in the `winner-proofs` bucket by default.
- `CRON_SECRET` protects the scheduled draw endpoint.
- `PLATFORM_ADMIN_EMAILS` can auto-assign admin role during signup for listed email addresses.

## Remaining Credential-Dependent Steps

After pulling the code, you still need to:

1. Create a Supabase project and run the SQL migration.
2. Add the Supabase, Stripe, Resend, and cron env vars.
3. Create the monthly and yearly Stripe prices.
4. Configure the Stripe webhook endpoint to point at `/api/stripe/webhooks`.
5. Optionally configure Vercel Cron to call `/api/cron/draw` with the bearer secret.
