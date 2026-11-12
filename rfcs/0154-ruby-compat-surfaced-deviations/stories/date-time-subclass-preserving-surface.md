---
title: "date-time-subclass-preserving-surface"
status: draft
updated: 2026-11-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TZInfo::TimeWithOffset < Time` and `DateTimeWithOffset < DateTime`
(`vendor/tzinfo/v2.0.6/lib/tzinfo/time_with_offset.rb`, `datetime_with_offset.rb`) override
methods and call `super`, and rely on the base class answering the receiver's subclass.
`@blazetrails/date` (`packages/date/lib/time.ts`, `date.ts`) is missing, beyond
`date-time-localtime-and-datetime-jd` (`Time#localtime`, `DateTime.jd`):

- `Time#gmtime` (`time_gmtime`, `vendor/ruby/v3.3.11/time.c:4169`, same body as `utc`), `Time#round`
  (`time_round`, `time.c:4550`), `Time#to_a` (`time_to_a`, `time.c:4880`).
- `Time.at` / `#getlocal` build `new Time` via `Time.#atInstant` / `#timeNewTimew`
  (`time.ts:685-760`), so `TimeWithOffset.at(...)` answers a plain `Time`; MRI allocates `klass`
  (`time_s_at`, `time.c:2943`) and `time_getlocaltime` dups the receiver (`time.c:4280`).
- `Time#to_datetime` (`time.ts:1667`) answers a Temporal value, not a `DateTime`.
- `DateTime#new_offset` (`date.ts:6527`) builds `new DateTime`, dropping the receiver's class
  (`d_lite_new_offset` uses `copy_complex_to_complex` on a dup of `self`).

## Acceptance criteria

- [ ] `Time#gmtime`, `#round`, `#to_a` ported at their MRI names.
- [ ] `Time.at`, `#getlocal`, `#round` answer an instance of the receiving subclass.
- [ ] `Time#to_datetime` answers a `DateTime`.
- [ ] `DateTime#new_offset` preserves the receiver's class.
