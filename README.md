<div align="center">

<img src="public/favicon.svg" width="88" alt="SaafSnap logo" />

# SaafSnap

**Snap the mess. We'll get it cleaned.**

One photo of garbage, a dirty river or a choked drain. Gemini works out what it is, how serious it is and which officer is responsible, then files the complaint for you. The public map turns red as more people report a spot, and stays red until someone uploads AI-verified proof that it was cleaned.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-API-8E75B2?logo=googlegemini&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)

</div>

---

## The problem

Garbage on roads, plastic in rivers and blocked drains are everywhere, but reporting them is hard:

- People don't know **which department** handles which kind of waste.
- Complaints disappear with **no follow-up** and no public record.
- When someone does clean up, **nobody gets credit**, and fake "cleaned" claims are easy.

## The solution

SaafSnap turns a messy, real-world input (a phone photo and a location) into a structured, verified action.

| Step | What happens |
|---|---|
| **1. Snap** | Take a photo, like posting on Instagram. GPS is picked up automatically. |
| **2. AI routes it** | Gemini identifies the waste type, severity (1–10), volume, health risks and deadline, then picks the responsible department and ward officer and drafts the complaint. |
| **3. Public pressure** | Every "I saw this too" makes the spot bigger and redder on the city map. Missed deadlines escalate automatically: officer → executive engineer → commissioner. |
| **4. Clean & get credit** | Anyone (government, NGO, group or citizen) uploads an "after" photo. AI checks it's a real camera photo, at the same place, taken after the report and actually clean. The spot turns green and shows the cleaner's name and logo. |

## Features

- **Snap flow:** camera or gallery, GPS / photo GPS / tap-the-map location, animated AI scan, routed complaint letter
- **Duplicate detection:** reports within 150 m prompt you to back the existing one instead
- **Instagram-style feed:** one clean column of posts; double-tap a photo for "I saw this too"
- **Settings → Your activity:** what you reported, cleaned and backed, plus location and account settings
- **Pollution map:** priority-coloured pins and heat circles, pulsing critical spots, "near me"
- **Before / after slider** on every cleaned report
- **Animated leaderboard:** who cleans most (government vs NGOs vs citizens), a per-department government report card, and top people
- **Badges and points** with celebration animations
- **Login:** email or **Continue with Google**; asks for location right after login
- **Roles:** Citizen (instant), NGO / Government / Group (verified by an admin)
- **Government desk:** an officer's own department inbox, overdue alerts and "start work"
- **Admin panel:** approve or reject organisations, moderate reports, load demo data
- **Mobile first:** bottom tab bar with a big camera button, tested down to 320 px wide

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 5, React Router, Tailwind CSS, Framer Motion, Lucide icons |
| Maps | Leaflet + OpenStreetMap |
| AI | Gemini API with structured JSON output (`gemini-3.5-flash`, automatic fallback to other models) |
| Backend | Supabase: Postgres, Auth, Storage, Realtime, row-level security |
| Offline mode | IndexedDB, used automatically when Supabase isn't configured |

```mermaid
flowchart LR
    A[Photo + GPS] --> B[Gemini analysis]
    B --> C{Department router}
    C --> D[Ward officer inbox]
    D -->|no action in time| E[Auto-escalation]
    A --> F[Public map + feed]
    F -->|more reports| G[Higher priority]
    H[After photo] --> I[Gemini + EXIF + GPS checks]
    I -->|verified| J[Spot turns green, badge + credit]
```

## Getting started

```bash
git clone https://github.com/Fun-with-Science/Saafsnap.git
cd Saafsnap
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

Open http://localhost:5173.

### Environment variables

| Variable | Where to get it | Required |
|---|---|---|
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) → API keys | No: without it a built-in offline analyser is used |
| `VITE_GEMINI_MODEL` | Defaults to `gemini-3.5-flash` | No |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | No: without it data stays in the browser |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (publishable key, `sb_publishable_...`) | No |

The sidebar shows which AI and data mode is active.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste all of [`supabase/setup.sql`](supabase/setup.sql) and click **Run**. It creates the tables, security rules, photo storage and realtime. It's safe to run again. If you ran an older copy of it, also run [`supabase/grants.sql`](supabase/grants.sql): new Supabase projects don't give the app access to new tables automatically.
3. Turn off **Authentication → Sign In / Providers → Email → Confirm email** if you want new users to log in without clicking an email link.
4. Put the project URL and publishable (anon) key in `.env` and restart `npm run dev`.
5. Sign up in the app with your own account, then run [`supabase/make-admin.sql`](supabase/make-admin.sql) with your email to become the admin.

Projects set up with an older `setup.sql` also contain demo accounts (`@saafsnap.demo`). After step 5, run [`supabase/remove-demo-data.sql`](supabase/remove-demo-data.sql) to delete them and their reports.

### Continue with Google

1. In [Google Cloud Console](https://console.cloud.google.com/), set up the **OAuth consent screen** (Google Auth Platform → Branding / Audience), then create an **OAuth client ID** of type **Web application**.
2. Add **Authorised JavaScript origins**: `http://localhost:5173` and your live site, for example `https://saafsnap.vercel.app`.
3. Add **Authorised redirect URI**: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. In Supabase, go to **Authentication → Sign In / Providers → Google**, turn it on and paste the Client ID and Client Secret.
5. In Supabase, go to **Authentication → URL Configuration**, set **Site URL** to your live site and add `http://localhost:5173/**` and `https://<your-site>/**` to **Redirect URLs**.

The Client Secret only goes into Supabase. It never goes in `.env` or the app code.

## Offline demo mode

Without Supabase settings, the app runs entirely in the browser with 19 demo reports and these demo logins (one-tap buttons on the login page):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@saafsnap.demo` | `admin1234` |
| Citizen | `citizen@saafsnap.demo` | `demo1234` |
| NGO | `greenganga@saafsnap.demo` | `demo1234` |
| Government (Solid Waste) | `swm@saafsnap.demo` | `demo1234` |

These exist only in offline demo mode, not in the live Supabase app.

## Project structure

```
src/
  pages/            Landing, Login, Signup, Feed, NewReport, ReportDetail,
                    MapPage, Leaders, Profile, Settings, Activity, DeptDesk, Admin
  components/       AppShell, ReportCard, MapView, LeaderChart, Stickers,
                    AiScanner, PhotoPicker, Celebration, ui (shared pieces)
  lib/
    ai.js           Gemini analysis + cleanup verification (with offline fallback)
    departments.js  Department directory, ward + escalation chain
    priority.js     Priority score, escalation timing, distances
    badges.js       Badge rules
    reportOps.js    Report state changes (offline backend)
    backend/        supabase.js (shared) and local.js (offline)
    store.jsx       App state, actions, badge celebrations
supabase/           setup.sql (schema + security), make-admin.sql, grants.sql, remove-demo-data.sql
public/stickers/    Government character stickers
public/seed/        Demo report photos (Wikimedia Commons, see CREDITS.md)
```

## Security notes

- Reports can only change through database functions (back a report, start work, submit cleanup). There are no direct updates.
- Only admins can approve organisations or delete reports. Sign-ups can never make themselves admin.
- Emails are visible only to their owner and admins.
- The Gemini key is used from the browser, which is fine for a demo. For production, move the Gemini calls and cleanup verification into a Supabase Edge Function so the key stays secret and verification can't be faked.

## Credits

Demo report photos are from Wikimedia Commons under CC0 / CC BY / CC BY-SA licences. Authors and links are listed in [CREDITS.md](CREDITS.md).

## Roadmap

- Server-side Gemini calls and verification (Edge Functions)
- Real email / WhatsApp delivery of complaints to officers
- Ward boundaries from official GIS data instead of estimated wards
- Multi-language support (Hindi, Bengali)
