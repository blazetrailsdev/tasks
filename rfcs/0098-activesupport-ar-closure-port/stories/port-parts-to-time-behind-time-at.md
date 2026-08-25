---
title: "port-parts-to-time-behind-time-at"
status: done
updated: 2026-08-22
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6848
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-the-five-unported-time-zone-members` ported four of its five members
(`abbr`, `time_now`, `zones_map`, `load_country_zones` — the last two existed
already as `#private` JS methods the extractor cannot see, and were re-spelled
`private static`). `parts_to_time`
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:585-608`)
was split out, because it is not a standalone port:

- Its body needs `Time.at(parts[:seconds])` and `Time.new(y, m, d, h, min,
sec, offset)`. `@blazetrails/date`'s `Time` exposes `now` / `utc` / `mktime`
  only (`packages/date/src/time.ts:239-331`) — no `at`. This is the gap
  `time-helpers-stub-date-and-datetime-clock` already records.
- Rails reaches it only from `parse` (time_zone.rb:453-455) and `strptime`
  (:507-509), both of which are `parts_to_time(Date._parse(...), now)`.
  trails' `parse` (`packages/activesupport/src/values/time-zone.ts:723`) and
  `strptime` (:775) are bespoke component-scanning implementations that never
  build a parts hash, so porting `parts_to_time` without converging those two
  onto `Date._parse` / `DateTime._strptime` adds a body nothing calls.

## Acceptance criteria

- [ ] `Time.at` exists in `@blazetrails/date` (or this story is blocked on the
      story that adds it, named explicitly).
- [ ] `partsToTime(parts, now)` is ported private with Rails' guards in order:
      `ArgumentError "invalid date"` on nil, early return on empty, the
      `parts[:seconds]` arm, then the `Time.new(...)` arm with Rails' exact
      `fetch` defaults (note `fetch` returns a STORED nil, unlike `??`).
- [ ] `parse` and `strptime` route through it, so it is reachable.
- [ ] `pnpm parity:api` activesupport `values/time_zone.rb` rises by 1.
