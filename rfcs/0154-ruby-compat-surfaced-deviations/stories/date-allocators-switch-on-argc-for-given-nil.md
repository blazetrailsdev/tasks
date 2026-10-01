---
title: "date: Date.civil/jd/ordinal/commercial and DateTime's allocators default a given nil where MRI switches on argc"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8333 made `Date`'s constructor follow `date_initialize`'s `switch (argc)`
(`vendor/ruby/v3.3.11/ext/date/date_core.c:3495-3526`) for `year` / `month` / `day`: an argument that is
GIVEN is checked, so `Date.new(2020, nil)` raises `TypeError: invalid month (not numeric)`
(`packages/date/src/date.ts`, the three `arguments.length` lines in the constructor).

The rest of the allocators still use TS default parameters, which swallow an explicitly passed
`undefined` (Ruby `nil`) and substitute the default where MRI raises:

- the constructor's own `start = DEFAULT_SG` (`date_core.c:3515-3516`, `val2sg(vsg, sg)` runs when `argc == 4`)
- `Date.jd` (`date.ts:4718`, `date_s_jd` `date_core.c:3353`)
- `Date.ordinal` (`date.ts:4726`, `date_s_ordinal` `:3418`)
- `Date.civil` (`date.ts:4740`, `date_s_civil` `:3466-3469`, which is `date_initialize(argc, argv, …)` verbatim —
  the port instead applies its own defaults and always calls the constructor with four arguments)
- `Date.commercial` (`date.ts:4755`, `date_s_commercial` `:3601`)
- `DateTime.jd` / `.ordinal` / `.civil` / `.commercial` (`date.ts:6009,6067,6129,6142`, `datetime_s_civil` `:7814` and siblings)

## Converged shape

Each allocator switches on `arguments.length` as its C body switches on `argc`, with the Rails-facing
optional parameters left un-defaulted, and `Date.civil` forwards its arguments to the constructor unchanged.

## Acceptance criteria

- [ ] Each allocator above raises `TypeError` for a given `nil` argument exactly where `ruby -rdate` does, with a test per allocator in `date.trails.test.ts` (verify each expectation by running `ruby`).
- [ ] `Date.civil` no longer re-applies defaults before calling the constructor.
- [ ] `packages/date` tests stay green.
