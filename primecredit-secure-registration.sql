-- PrimeCredit secure business registration
-- Run this once in the Supabase SQL Editor after the main database setup.

alter table public.loan_staff enable row level security;

drop policy if exists primecredit_staff_insert on public.loan_staff;

create policy primecredit_staff_insert
on public.loan_staff
for insert
to authenticated
with check (
  business_id = public.current_primecredit_business_id()
);

-- The register-primecredit-business Edge Function uses the service role and
-- can create the first administrator. Signed-in users cannot create a new
-- business or attach themselves to another business through the public API.
