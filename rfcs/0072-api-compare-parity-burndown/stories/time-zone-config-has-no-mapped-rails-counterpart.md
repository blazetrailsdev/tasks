---
title: "time-zone-config.ts is unmapped: it is the port of core_ext/time/zones.rb"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6250
claim: "2026-08-08T17:40:02Z"
assignee: "date-constructor-is-proleptic-gregorian-not-italy"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activesupport` reports
`time-zone-config.ts — 6 novel, 6 moved [no Rails counterpart]`: the file map
points no `.rb` at it, so its whole surface is scored against an empty allowed
set. It is in fact the port of
`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb`
(`Time.zone`, `Time.zone=`, `Time.use_zone`, `Time.find_zone`,
`Time.find_zone!`, `Time.current`) — PR #6234 converged `findZoneBang` against
`zones.rb:83` and `dateInTimeZone` against `core_ext/date_and_time/zones.rb`,
citing both, while the tool still believes neither file exists.

The path translation cannot derive it: Rails' `core_ext/time/zones.rb` would map
to `core-ext/time/zones.ts`, and the trails file sits at the package root under
a different basename.

## Converged shape

Add the mapping to `RUBY_FILE_TS_OVERRIDES` in
`scripts/api-compare/conventions.ts` (regenerating
`docs/ruby-ts-conventions.md`), so the file is scored against `zones.rb`'s
members and its 6 novel names either resolve to Ruby methods or become real,
visible extras.

## Acceptance criteria

- [ ] `time-zone-config.ts` maps onto `core_ext/time/zones.rb`; parity:api:extra no
      longer marks it `[no Rails counterpart]`.
- [ ] The extras it still reports are genuine, and the moved names are
      re-scored against the real allowed set.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas are non-negative.
