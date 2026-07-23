# PrimeCredit System Handover

Last updated: 23 July 2026  
System: PrimeCredit only  
Repository: `okana123456/PrimeCredit`  
Local working folder: `C:\Users\Admin\Documents\Codex\2026-07-01\ho\work\PrimeCredit`  
Branch: `main`

This handover is intentionally limited to PrimeCredit. Do not apply these notes to Radari, Wamama, Bripta/Loanflow, or Prime Braidox.

## 1. System Purpose and Users

PrimeCredit is a multi-business loan management system for small lending businesses. It supports business registration, client onboarding, loan applications, loan approval, disbursement tracking, repayments, arrears, reports, M-Pesa C2B payment detection, and monthly system subscription locking.

Main users:

- Platform owner: controls the private registration key and service subscription setup.
- Business admin: registers a lending business, manages staff, clients, loan applications, settings, reports, M-Pesa setup, and approvals.
- Loan officers: manage assigned clients, loan applications, repayments, client photos, and field activity depending on their role permissions.

## 2. Technology Stack

- Frontend: single-file HTML/CSS/JavaScript app in `index.html`.
- Hosting: Vercel.
- Backend/database: Supabase.
- Authentication: Supabase Auth.
- Database security: Supabase Row Level Security with business isolation.
- Edge Functions: Supabase Edge Functions using Deno.
- File storage: Supabase Storage buckets for compressed client and asset photos.
- Payments: Safaricom Daraja C2B callbacks for loan repayments and STK push for monthly service subscription payments.
- App install/PWA: `manifest.webmanifest`, `service-worker.js`, and icon files under `assets`.

## 3. Repository and Branch

- GitHub repo: `https://github.com/okana123456/PrimeCredit`
- Active branch: `main`
- Main file: `index.html`
- GitHub Desktop folder to use: `C:\Users\Admin\Documents\Codex\2026-07-01\ho\work\PrimeCredit`

## 4. Supabase Project

- Supabase project ref: `ahzdlgsdpmltrlhbervv`
- Supabase project URL: `https://ahzdlgsdpmltrlhbervv.supabase.co`
- Frontend Supabase REST URL style: `https://ahzdlgsdpmltrlhbervv.supabase.co/rest/v1/`
- Public anon key is embedded in `index.html` as `SUPABASE_KEY`.
- Do not put service role keys in frontend files.

## 5. Completed Features

- Bright PrimeCredit branding and PWA install support.
- Multi-business registration using a private registration key.
- Each business is isolated by `business_id`.
- Admin and loan officer roles.
- Client registration with next of kin details only.
- Guarantor details moved to loan application, not client registration.
- Loan application flow with guarantor fields.
- Loan applications can be viewed and edited before approval/disbursement.
- Application asset photos are uploaded under the loan application flow.
- Client profile photo upload with cropper.
- Asset photo upload with compression to reduce storage usage.
- Client photo can be removed or changed by admin.
- Loan officers can upload pictures, but admin controls editing/removal.
- Processing fee policy:
  - KES 250 for loans of KES 5,000 and below.
  - KES 500 for loans above KES 5,000.
- Client registration fee: KES 500.
- Monthly interest policy: 20% per month.
- Processing fee and registration fee are deducted from disbursed loan amount.
- Loan schedules and repayments update balances.
- Cleared zero-balance active loans repair SQL was added.
- Admin dashboard and loan officer dashboards include expected daily collections.
- Repayment tab shows balances and M-Pesa references.
- Pending payments show phone number for easier tracking.
- Suspense/unmatched payments can be matched manually.
- Business settings allow Daraja credentials to be pasted and saved.
- Daraja C2B callback can auto-match repayments using the account number.
- Account number rule: clients should use their recorded ID number as the M-Pesa account number.
- Separate PrimeCredit callback function exists to avoid confusion with other systems.
- Monthly service subscription lock exists using STK push.
- Service subscription amount is configured in frontend as `SERVICE_BILLING_AMOUNT`.
- Browser cache refresh fixes were added so different browsers load current data better.
- `vercel.json` disables caching for `index.html` and `service-worker.js`.

## 6. Current Architecture

Frontend:

- `index.html` contains the whole UI, styling, Supabase client setup, auth handling, data loading, business logic, modals, reports, and app install logic.
- `service-worker.js` supports installable app behavior and has version/cache handling.
- `manifest.webmanifest` defines installed app metadata.
- `assets/` contains PrimeCredit icons.

Backend:

- Supabase tables store staff, settings, clients, products, applications, loans, schedules, repayments, penalties, reports, billing cycles, callbacks, and unmatched payments.
- Supabase Storage stores compressed images in public buckets.
- Edge Functions handle secure business registration, Daraja URL registration, C2B payment callbacks, service subscription STK push, service payment callback, and diagnostics.

Important frontend constants in `index.html`:

- `APP_VERSION = 'primecredit-2026-07-23-cache-v5'`
- `SUPABASE_URL = 'https://ahzdlgsdpmltrlhbervv.supabase.co'`
- `SERVICE_BILLING_AMOUNT = 2000`
- `SERVICE_BILLING_FIRST_REMINDER_DATE = '2026-08-02'`
- `SERVICE_BILLING_REMINDER_DAY = 2`
- `SERVICE_BILLING_LOCK_DAY = 4`
- `CLIENT_PHOTO_BUCKET = 'client-photos'`
- `CLIENT_ASSET_BUCKET = 'client-assets'`

## 7. Database Structure and Important Business Rules

Main tables created/used by `primecredit-database-setup.sql`:

- `loan_staff`: staff/users for each business.
- `loan_settings`: business settings, including M-Pesa settings.
- `loan_clients`: borrower/client records.
- `loan_products`: loan products.
- `loan_applications`: pending/submitted/approved/rejected/disbursed applications.
- `loans`: approved/disbursed loan accounts.
- `loan_schedules`: installment schedule rows.
- `loan_repayments`: manual and M-Pesa repayments.
- `loan_penalties`: penalty rows.
- `loan_follow_ups`: follow-up notes/actions.
- `journal_entries`: accounting/revenue logs.
- `loan_audit_log`: activity tracking.
- `loan_billing_cycles`: monthly PrimeCredit subscription lock/payment records.
- `mpesa_callback_queue`: incoming Daraja callback queue.
- `unmatched_payments`: payments that could not be matched automatically.

Important functions/policies:

- `public.current_primecredit_business_id()` resolves the logged-in user's business.
- `public.primecredit_can_access_business(target_business_id text)` supports safer multi-business access.
- RLS is enabled on core business tables.
- Policies restrict records by `business_id`.

Important indexes:

- Unique client ID per business.
- Unique client phone per business.
- Unique M-Pesa payment reference per business.
- Indexes on business/status/date fields for faster dashboards and reports.

Business rules:

- A client belongs to one business through `business_id`.
- Users must only see records for their own business.
- New business signup requires the Edge Function `register-primecredit-business` and the secret `PRIMECREDIT_REGISTRATION_KEY`.
- Client registration captures next of kin, not guarantor.
- Guarantor is captured on loan application.
- Client payment account number should be the client ID number.
- If C2B auto-confirm is enabled and the callback finds a client and active loan, repayment is created automatically.
- If callback cannot match the payment, it should go to `unmatched_payments`.
- Cleared loans should not remain active with zero balance.
- Processing fee:
  - KES 250 for loan amount <= KES 5,000.
  - KES 500 for loan amount > KES 5,000.
- Registration fee:
  - KES 500 for newly registered client/first loan handling.
- Fees are deducted from the loan disbursement amount, not added to loan balance.

## 8. SQL Files in the Repo

Run these in Supabase SQL Editor when setting up or repairing the system:

- `primecredit-database-setup.sql`: main tables, functions, policies, storage buckets, indexes.
- `primecredit-photo-storage.sql`: photo bucket/storage policy setup.
- `primecredit-secure-registration.sql`: registration key support and secure signup setup.
- `primecredit-application-guarantor-update.sql`: adds guarantor fields/index to applications.
- `primecredit-multi-business-access-fix.sql`: fixes business isolation/session access across browsers and multiple businesses.
- `primecredit-fee-deduction-repair.sql`: repairs affected loans so processing and registration fees are deducted from disbursed amount.
- `primecredit-clear-zero-balance-active-loans.sql`: fixes cleared loans that were still active or had stale balances.

When a setup SQL says `current_primecredit_business_id()` does not exist, run `primecredit-database-setup.sql` first, then rerun the later patch SQL.

## 9. Edge Functions

All Edge Function source folders are under:

`supabase/functions/`

Functions:

- `register-primecredit-business`
  - Securely creates a new PrimeCredit business/admin.
  - Requires registration secret.
  - Creates default settings and products.

- `register-daraja`
  - Registers the business Paybill C2B confirmation and validation URLs with Safaricom.
  - Uses the business admin's saved/pasted Daraja credentials from settings.
  - Current confirmation/validation callback is:
    `https://ahzdlgsdpmltrlhbervv.supabase.co/functions/v1/primecredit-payment-callback`

- `primecredit-payment-callback`
  - Main C2B callback for PrimeCredit loan repayment payments.
  - Reads Daraja callback payload.
  - Uses shortcode to find `loan_settings`.
  - Uses account number/BillRefNumber to match `loan_clients.id_number`.
  - Creates repayment in `loan_repayments` when matched.
  - Updates `loan_schedules`.
  - Stores unmatched payments when not matched.
  - Has console logs for debugging.

- `payment-callback`
  - Older/general callback copy. Prefer `primecredit-payment-callback` for PrimeCredit.

- `start-service-payment`
  - Starts the platform subscription STK push.
  - Uses Rudder/service Daraja secrets.
  - Saves checkout request in `loan_billing_cycles`.

- `service-payment-callback`
  - Receives STK payment result for monthly PrimeCredit system subscription.
  - Marks billing cycle paid/failed.

- `service-daraja-diagnostics`
  - Diagnostic Edge Function for testing service STK credentials without touching normal app flow.
  - Useful before enabling monthly subscription lock.

## 10. Edge Function Secrets

Set these in Supabase Dashboard > Edge Functions > Secrets.

Standard Supabase secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

PrimeCredit registration secret:

- `PRIMECREDIT_REGISTRATION_KEY`
  - Private owner-issued key required when a new business registers.
  - Do not expose this publicly.

Service subscription Daraja secrets for Rudder/platform owner monthly billing:

- `SERVICE_CONSUMER_KEY`
- `SERVICE_CONSUMER_SECRET`
- `SERVICE_PASSKEY`
- `SERVICE_SHORTCODE`
- `SERVICE_TRANSACTION_TYPE`
- `SERVICE_DARAJA_ENVIRONMENT`
- `SERVICE_CALLBACK_URL`
- `SERVICE_BILLING_AMOUNT`

Expected values/notes:

- `SERVICE_TRANSACTION_TYPE` is normally `CustomerPayBillOnline`.
- `SERVICE_DARAJA_ENVIRONMENT` should be `production` for live Paybill.
- `SERVICE_BILLING_AMOUNT` should match the amount the business pays monthly.
- `SERVICE_CALLBACK_URL` can be left unset if using the default:
  `https://ahzdlgsdpmltrlhbervv.supabase.co/functions/v1/service-payment-callback`

Fallback compatibility:

- Some functions also read `DARAJA_*` names if `SERVICE_*` names are missing, but for PrimeCredit handover use `SERVICE_*` for platform subscription secrets.

Business client-payment Daraja credentials:

- These are normally entered in the PrimeCredit app Settings by the business admin.
- They should not be hardcoded into frontend or README.
- The business Paybill must register the callback URL shown above.

## 11. Daraja / M-Pesa Notes

There are two separate payment flows:

1. Client loan repayments through business Paybill/C2B.
   - Parent/customer/client pays via Paybill.
   - Account number should be the client's ID number as stored in `loan_clients.id_number`.
   - Safaricom sends the C2B callback to `primecredit-payment-callback`.
   - The system matches the ID number to a client and active loan.

2. Business monthly subscription payment to the platform owner.
   - Triggered by STK push from `start-service-payment`.
   - Callback goes to `service-payment-callback`.
   - Successful payment unlocks/extends the business system subscription.

Important Daraja behavior:

- One Paybill/shortcode generally has one active C2B callback registration at a time.
- If the same shortcode is reused across different systems, callback conflicts can happen.
- A business with multiple systems should either use one routing callback that can identify each system clearly, or use separate shortcodes/paybills where possible.
- Sandbox can test callback structure, but live production callback behavior must be verified using the actual business Paybill.

## 12. Deployment Information

Frontend:

- Hosted on Vercel.
- Repository is connected through GitHub.
- Pushes to `main` should redeploy the app.
- `vercel.json` sets no-cache headers for `index.html` and `service-worker.js` to reduce stale browser issues.

Supabase:

- SQL files must be pasted/run in Supabase SQL Editor.
- Edge Functions must be deployed in Supabase Edge Functions with folder names exactly matching the function names.
- Edge Function JWT setting may need to be disabled for public callbacks such as Daraja C2B and STK callbacks, depending on Supabase dashboard settings.

PWA/app install:

- `manifest.webmanifest`
- `service-worker.js`
- `assets/primecredit-icon.svg`
- `assets/primecredit-icon-192.png`
- `assets/primecredit-icon-512.png`
- `assets/primecredit-icon-512-maskable.png`

## 13. Files Changed / Important Files

Core app:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `vercel.json`

Assets:

- `assets/primecredit-icon.svg`
- `assets/primecredit-icon-192.png`
- `assets/primecredit-icon-512.png`
- `assets/primecredit-icon-512-maskable.png`

SQL:

- `primecredit-database-setup.sql`
- `primecredit-photo-storage.sql`
- `primecredit-secure-registration.sql`
- `primecredit-application-guarantor-update.sql`
- `primecredit-multi-business-access-fix.sql`
- `primecredit-fee-deduction-repair.sql`
- `primecredit-clear-zero-balance-active-loans.sql`

Edge Functions:

- `supabase/functions/register-primecredit-business/index.ts`
- `supabase/functions/register-daraja/index.ts`
- `supabase/functions/primecredit-payment-callback/index.ts`
- `supabase/functions/payment-callback/index.ts`
- `supabase/functions/start-service-payment/index.ts`
- `supabase/functions/service-payment-callback/index.ts`
- `supabase/functions/service-daraja-diagnostics/index.ts`

## 14. Known Bugs / Risks

- Callback registration can fail with "URLs already registered" or duplicate notification messages if the Paybill is already registered to another callback.
- If a live Paybill is pointed to a different system callback, PrimeCredit will not receive payments automatically.
- Some browsers may keep old service worker/cache state; version bumping `APP_VERSION` and pushing `service-worker.js` changes helps.
- The app is a large single HTML file, so edits must be careful and tested with JavaScript parsing after changes.
- There may be old imported/demo records with inconsistent notes or historic fee handling; use repair SQL carefully.
- Some older code/comments may still describe processing fees as upfront; the current business requirement is that processing fee and registration fee are deducted from the disbursed loan amount.

## 15. Unfinished Work

- Confirm every business's production Daraja callback registration after they add their own Paybill credentials.
- Decide final strategy if Prime Braidox and PrimeCredit share one Paybill/shortcode.
- Add deeper automated tests if the system is later converted from single-file HTML to a structured app.
- Consider moving sensitive admin operations fully to Edge Functions over time.
- Consider a platform-owner console for seeing all registered businesses, billing status, and callback health.

## 16. Recommended Next Tasks

1. Confirm current Vercel production URL and add it here.
2. Confirm Supabase Auth redirect URLs match the production Vercel URL.
3. Test new business signup using `PRIMECREDIT_REGISTRATION_KEY`.
4. Test photo upload with a real phone and desktop browser.
5. Test application edit flow before approval, including guarantor and asset photos.
6. Test C2B callback using sandbox, then with the actual business Paybill.
7. Test service subscription STK payment with KES 1 diagnostics before setting full monthly amount.
8. Review all labels mentioning processing fee to ensure they match the current deduction rule.
9. Before every future edit, confirm this exact folder:
   `C:\Users\Admin\Documents\Codex\2026-07-01\ho\work\PrimeCredit`

## 17. Quick Startup Prompt for a New Codex Chat

Use this prompt when starting a fresh Codex chat:

> We are working only on PrimeCredit, not Radari, Wamama, Bripta/Loanflow, or Prime Braidox. The repo is `okana123456/PrimeCredit`, branch `main`, local folder `C:\Users\Admin\Documents\Codex\2026-07-01\ho\work\PrimeCredit`. Read `PRIMECREDIT_HANDOVER.md` first, then inspect `index.html`, the SQL files, and `supabase/functions` before making changes. Keep all edits scoped to PrimeCredit.
