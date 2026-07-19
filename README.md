# Prime Layer Coatings — Web + Business Manager

Public marketing site and internal CRM for **Prime Layer Coatings LLC** (Las Vegas, NV).

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Live URLs

| URL | Purpose |
|-----|---------|
| https://www.primelayercoating.com | Public website |
| https://www.primelayercoating.com/admin | Staff CRM dashboard |

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + legacy CSS for marketing |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| AI | Anthropic Claude (Ava chatbot) |
| Email | Gmail SMTP (Nodemailer) |
| Hosting | Vercel |

## Project structure

```
app/
  page.tsx              Marketing homepage
  admin/                CRM dashboard (protected)
  api/                  submit-quote, chat
components/
  marketing/            Public site React components
  admin/                CRM React components
lib/
  supabase/             Client, server, admin, middleware
  mailer.ts             Email notifications
public/
  fotos/                Gallery images & videos
  styles.css            Marketing styles (imported in globals.css)
supabase/migrations/    Database schema SQL
types/                  TypeScript types
```

## Setup

### 1. Environment variables (Vercel)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=          # same as SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
GMAIL_USER=
GMAIL_APP_PASSWORD=
COMPANY_EMAIL=
```

### Twilio SMS (optional)

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=     # e.g. +17025551234
COMPANY_PHONE=           # your cell for new-lead alerts
```

### 2. Database migration

Run `supabase/migrations/001_crm_schema.sql`, `002_storage.sql`, and `003_client_portal.sql` in Supabase SQL Editor.

### 3. Create admin user

1. Supabase → Authentication → Add user
2. SQL: `UPDATE public.profiles SET role = 'admin' WHERE id = 'USER-UUID';`

### 4. Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run optimize-images      # JPEG → WebP
```

## CRM Features

- [x] Auth (login / logout, roles)
- [x] Dashboard with stats
- [x] Leads CRUD (search, filter, status)
- [x] Clients CRUD
- [x] Estimates + line items + PDF print + email to client
- [x] Projects + calendar + payments + photo uploads
- [x] Lead → Client conversion + create estimate from lead
- [x] Dashboard quick links
- [x] SMS notifications (Twilio) on leads + project status
- [x] Client tracking portal `/track/[token]` with bilingual timeline
