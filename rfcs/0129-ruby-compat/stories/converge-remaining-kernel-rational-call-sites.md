---
title: "Remaining ported bodies spell new Rational() where Rails calls Kernel#Rational()"
status: draft
updated: 2026-08-30
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby has two spellings of Rational and Rails calls the FUNCTION. PR #7240
shipped both (`packages/ruby-compat/src/rational.ts`: the `Rational` class at
`vendor/ruby/rational.c:481` `nurat_s_canonicalize_internal`, and `rational()`
at `:2691` `nurat_s_convert`) and converged the three call sites the
`call-mismatches-exclude` shard held — `end_of_day` / `end_of_hour` /
`end_of_minute`. The remaining ported sites still spell `new Rational(...)`
where Rails writes `Rational(...)`:

- `packages/activesupport/src/core-ext/date-time/calculations.ts:135,142,144,228,329,350`
  against `activesupport/lib/active_support/core_ext/date_time/calculations.rb:54,56,57,141,153,165`
  (`change`'s `new_fraction` / `new_usec`, `since`'s `self + Rational(seconds, 86400)`,
  and the two `Rational(utc.sec, 1)` sums).
- `packages/activesupport/src/time-with-zone.ts:292` against
  `activesupport/lib/active_support/time_with_zone.rb:487,564`.

None of these is baselined — `parity:api:calls:args` reads both spellings as
the same `ref:rational` since #7240 taught `normalizeRef`
(`scripts/api-compare/call-args.ts`) to fold Kernel's conversion functions — so
this is a fidelity gap the gates cannot see, not a burndown row. `grep -rn
"Rational(" vendor/rails/{activesupport,activerecord}/lib` is the full site
list.

## Converged shape

Every ported body that mirrors a Rails `Rational(...)` call calls `rational()`;
`new Rational(...)` survives only where the trails code is not mirroring a Ruby
`Rational()` call (e.g. `packages/date/src/date.ts`'s internal C-constructor
arms, which mirror `rb_rational_new`).

## Acceptance criteria

- The sites above call `rational()`, with the Rails `file:line` each mirrors.
- `packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts:38`
  and `mysql/quoting.ts` audited the same way: converged, or left with the
  Ruby line showing they are not a `Rational()` call.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; no baseline row is added.
