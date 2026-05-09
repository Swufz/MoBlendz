# Mo Blendz

A mobile-first barber booking app built with Next.js App Router, TypeScript,
Tailwind CSS, and Supabase.

## Features

- Google login with Supabase Auth
- Automatic customer profile creation
- Minimal slide-style booking flow
- Haircut and haircut + beard service pricing
- Appointment durations: 30 and 45 minutes by default
- Business hours support through admin settings
- Booking conflict prevention for pending/confirmed appointments
- Customer profile with bookings, loyalty, referral code, and credits
- Admin dashboard with earnings and customer stats
- Admin completion confirmation summary before saving a haircut
- Loyalty and referral credit business logic
- Supabase RLS policies

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Create a Supabase project and paste the values into `.env.local`.

4. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

5. Start the app:

```bash
npm run dev
```

## Supabase Google OAuth

1. In Supabase, open **Authentication > Providers**.
2. Enable **Google**.
3. Add your Google OAuth client ID and secret.
4. In Google Cloud Console, add this redirect URL:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

5. In Supabase, add your local and production site URLs:

```text
http://localhost:3000
https://your-vercel-domain.vercel.app
```

## Admin User

The first user is created as a customer. To make yourself admin, update your row
in Supabase:

```sql
update profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Important Logic

- Cancelled and no-show appointments do not count toward loyalty or stats.
- Only completed bookings count toward earnings.
- After 4 paid completed haircuts, the next haircut is free.
- A free haircut does not count toward the next loyalty cycle.
- Referral credits are issued only after the referred customer completes their
  first haircut.
- Admin sees a completion summary before saving final cash due.
- Customers pay cash in person; there is no payment collection in the app.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
