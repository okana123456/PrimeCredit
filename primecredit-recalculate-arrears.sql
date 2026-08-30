-- PrimeCredit: recalculate active-loan arrears from schedules and maturity dates.
-- Rule:
-- 1. Installments due before today count as arrears only for their unpaid balance.
-- 2. Installments due today are current dues, not arrears.
-- 3. If a loan is past maturity and still has an outstanding balance, the full
--    outstanding balance remains in arrears until cleared.

begin;

with active_loans as (
  select
    l.id,
    l.business_id,
    l.outstanding_balance,
    l.maturity_date
  from public.loans l
  where l.status = 'active'
), schedule_arrears as (
  select
    s.loan_id,
    coalesce(sum(greatest(coalesce(s.total_due,0) - coalesce(s.total_paid,0),0)),0)::numeric(14,2) as unpaid_past_due,
    min(s.due_date) filter (
      where s.due_date < current_date
        and greatest(coalesce(s.total_due,0) - coalesce(s.total_paid,0),0) > 0.01
        and s.status <> 'paid'
    ) as oldest_unpaid_due
  from public.loan_schedules s
  join active_loans l on l.id = s.loan_id
  where s.due_date < current_date
    and s.status <> 'paid'
  group by s.loan_id
), calculated as (
  select
    l.id,
    case
      when coalesce(l.outstanding_balance,0) <= 0.01 then 0
      when l.maturity_date < current_date then greatest(coalesce(sa.unpaid_past_due,0), coalesce(l.outstanding_balance,0))
      else coalesce(sa.unpaid_past_due,0)
    end::numeric(14,2) as new_arrears,
    case
      when coalesce(l.outstanding_balance,0) <= 0.01 then null
      when l.maturity_date < current_date then least(coalesce(sa.oldest_unpaid_due,l.maturity_date), l.maturity_date)
      else sa.oldest_unpaid_due
    end as oldest_arrears_date
  from active_loans l
  left join schedule_arrears sa on sa.loan_id = l.id
)
update public.loans l
set
  arrears_amount = round(c.new_arrears,2),
  overdue_days = case
    when c.new_arrears <= 0.01 or c.oldest_arrears_date is null then 0
    else greatest(1, current_date - c.oldest_arrears_date)
  end,
  updated_at = now()
from calculated c
where l.id = c.id;

update public.loans
set
  status = 'completed',
  arrears_amount = 0,
  overdue_days = 0,
  updated_at = now()
where status = 'active'
  and coalesce(outstanding_balance,0) <= 0.01;

commit;

select
  c.full_name as client,
  l.loan_no,
  l.outstanding_balance,
  l.arrears_amount,
  l.overdue_days,
  l.maturity_date
from public.loans l
join public.loan_clients c on c.id = l.client_id
where l.status = 'active'
order by l.arrears_amount desc, l.overdue_days desc, c.full_name;
