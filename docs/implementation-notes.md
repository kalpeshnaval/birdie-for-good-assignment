# Golf Charity Platform Notes

This codebase is being built as a modern Next.js 16 App Router application with a demo-safe backend.

## Why Demo-Safe?

The PRD expects a full platform with subscriptions, score tracking, draw logic, charity impact, and admin controls.
To keep the app fully runnable before external credentials are configured, the first implementation uses:

- a local JSON-backed demo store for data
- signed cookie sessions for auth
- live integration seams for Stripe and email, with graceful fallbacks when provider keys are missing

This means the app works end-to-end right now, while still being structured so we can swap the data layer for Supabase later.

## Main Assumptions

These PRD details were not explicitly fixed, so the current build uses sensible defaults:

- monthly plan: `$29`
- yearly plan: `$290`
- default charity contribution: `10%`
- prize pool contribution: `35%` of subscription revenue
- draw numbers: a subscriber's current latest five Stableford scores form their five draw numbers
- algorithmic draw mode supports "hot" and "cold" score weighting from the active score pool

## Demo Credentials

- admin: `admin@golfcharity.local` / `Admin123!`
- subscriber: `player@golfcharity.local` / `Player123!`

## Code Map

- `lib/config.ts`: environment parsing and app-level constants
- `lib/store.ts`: demo persistence layer and domain mutations
- `lib/session.ts`: signed cookie session management
- `lib/draws.ts`: score window, draw generation, and prize calculations
- `app/_actions/*`: server actions for auth, subscriber flows, and admin tools
- `app/(app)/dashboard/*`: subscriber experience
- `app/(admin)/admin/*`: admin controls and reporting

## Next Steps

When real infrastructure is ready, we can replace the demo store with a Supabase adapter and turn on live Stripe/Resend credentials without redesigning the UI or business logic.

