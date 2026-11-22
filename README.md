# DARNA London — starter website

A bilingual-ready Arabic-first service and booking-request portal for DARNA London.
Built with React + Vite + Supabase. The current starter includes:
- Home page and service sections: property, hotels, visa assistance, business/office support.
- Service request form.
- Hybrid workflow: customer submits online; staff/admin review, assign and update status manually.
- Staff/admin sign-in and request status dashboard.
- Supabase SQL schema with initial RLS policies for profiles, requests, properties, hotel inquiries and commissions.
- Local demo mode for request submission before Supabase is configured.

## 1. Run locally

Install Node.js (LTS), then:

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite.

## 2. Configure Supabase (free tier)

1. Create a project at https://supabase.com/
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Project Settings → API, copy Project URL and anon/public key into `.env`.
4. Keep the Supabase `service_role` key private. Never put it in `.env` variables prefixed with `VITE_`.
5. Create the first user using Supabase Authentication.
6. Find that user's UUID in Authentication → Users and promote it using SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE_AUTH_USER_UUID';
```

7. Create staff users through Authentication, then set their `profiles.role` to `staff`.
8. Set `VITE_WHATSAPP_NUMBER` to the international number with digits only, e.g. `447...`.

## 3. Deploy free

### Cloudflare Pages
- Push this folder to a GitHub repository.
- In Cloudflare Pages, connect the repository.
- Build command: `npm run build`
- Build output directory: `dist`
- Add the same `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_WHATSAPP_NUMBER` environment variables in Pages settings.

A `*.pages.dev` subdomain is available without buying a custom domain, subject to provider terms and limits.

## 4. Important production work still required

This is a working starter, not a fully audited production system. Before accepting real customer data:
- Add CAPTCHA / rate limiting or a server-side submission endpoint to reduce spam.
- Add private Supabase Storage buckets and signed upload flows for visa/passport documents. Do not collect passport scans until secure storage and retention policy are in place.
- Add customer account portal, staff assignment UI, hotel booking records, property CRUD, commission reports, audit logs and notifications.
- Review all RLS policies and test them with anon, customer, staff and admin accounts.
- Add privacy notice, terms, cookie notice where applicable, and data retention process.
- Visa assistance must be described as administrative support only unless the business is properly authorised to provide immigration advice in the UK. Never promise visa approval.

## 5. Current limitations

- Listing cards are sample placeholders; replace them with verified live inventory.
- Hotel and visa services currently create service requests, not confirmed bookings or visa applications.
- The admin view currently supports staff login and service request status changes.
- Demo mode stores requests only in the current browser's local storage and is not shared with staff.
