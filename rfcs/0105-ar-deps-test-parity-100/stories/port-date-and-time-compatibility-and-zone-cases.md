---
title: "Port date_and_time compatibility, date/date_time ext and zone cases (33)"
status: claimed
updated: 2026-09-06
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "triage-activesupport-in-closure-skip-stubs"
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-09-06T23:16:21Z"
assignee: "port-date-and-time-compatibility-and-zone-cases"
blocked-by: null
closed-reason: null
---

## Context

These files are **in the AR require-closure** by the manifest from
`derive-ar-closure-test-manifest` — activesupport code ActiveRecord and
ActiveModel actually load — so they are on the critical path for this RFC's
`activesupport 100%`. Measured 2026-08-13 with
`pnpm parity:test -- --cached --package activesupport`:

- `vendor/rails/activesupport/test/core_ext/date_and_time_compatibility_test.rb` — 21 stubs
- `vendor/rails/activesupport/test/core_ext/date_ext_test.rb` — 7 remaining — 4 stubs, 3 missing
- `vendor/rails/activesupport/test/core_ext/date_time_ext_test.rb` — 0 remaining (converged)
- `vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb` — 3 stubs
- `vendor/rails/activesupport/test/time_zone_test.rb` — 2 stubs

Scope after `triage-activesupport-in-closure-skip-stubs` (2026-09-01): 4 of
`time_with_zone`'s 7 and 2 of `time_zone`'s 5 are Psych `!ruby/object:`
round-trips and are now exclusions, as is `works as ruby time zone`
(`Time.new(…, in: zone)`). What is left is portable: `no limit on times`,
`to r`, `plus two time instances raises deprecation warning`,
`travel to a date`, `travel to travels back and reraises if the block raises`,
and `date_ext`'s four `Time.zone`-set constructors.

Ports go in the convention TS file the compare report names beside each Ruby
file (e.g. `core_ext/hash_ext_test.rb` → `packages/activesupport/src/core-ext/hash-ext.test.ts`);
the Rails sources are under `vendor/rails/activesupport/lib/active_support/`.
Claim `triage-activesupport-in-closure-skip-stubs` first — it decides which of
these stubs are ports and which are case-level exclusions, and this story's
scope is whatever it marks as portable.

Overlap note: RFC 0098 owns the **API** gate for these same files (its core-ext
sweeps, time-with-zone residue and testing-helper slots). Where a case here
fails only because a member is unported, that member is 0098's — port it there
or file it there, and keep this PR to the test side.

## Acceptance criteria

- Each portable case exists with the Rails name verbatim, unskipped, passing.
- Non-portable cases carry case-level `tests:` exclusions with specific reasons
  (landed by the triage story, not invented here).
- `pnpm parity:test -- --package activesupport` shows these files at 0 missing
  and 0 skipped, and the AR-closure sub-metric rises accordingly.
- No new whole-file `unported-files` rows.
