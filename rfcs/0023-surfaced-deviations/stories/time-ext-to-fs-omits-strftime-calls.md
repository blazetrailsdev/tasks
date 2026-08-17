---
title: "Time#to_fs / formatted_offset omit Rails' strftime and utc calls — reds parity:api:calls on main"
status: closed
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Filed on false evidence, same cause as oid-array-constructor-omits-new-call: the 4 time-ext.ts rows were a STALE api-compare artifact. Verified on origin/main (b4b9fb144) with API_COMPARE_FORCE=1 pnpm parity:api --calls: 'call-mismatches ratchet: OK', zero NEW rows. Nothing to converge in time-ext.ts."
---

## Context

`pnpm parity:api:calls` is **red on `origin/main`** with four new rows in
`packages/activesupport/src/time-ext.ts`:

```text
+ activesupport  time-ext.ts  formatted_offset  utc?         (activesupport/time-ext.json)
+ activesupport  time-ext.ts  formatted_offset  utc_offset   (activesupport/time-ext.json)
+ activesupport  time-ext.ts  to_fs             strftime     (activesupport/time-ext.json)
+ activesupport  time-ext.ts  to_fs             strftime     (activesupport/time-ext.json)
```

Rails' `Time#formatted_offset` calls `utc?` and `utc_offset`, and `Time#to_fs`
calls `strftime` (twice — once per branch);
`vendor/rails/activesupport/lib/active_support/core_ext/time/conversions.rb`.
The trails bodies reach the same results without making those calls.

Introduced by **#6645** ("refactor(activesupport): route Time#to_fs through
DATE_FORMATS; port Date::DATE_FORMATS"), commit `b17c96fdc`, which rewrote
`to_fs`. The gate is only-shrink, so this reds `Rails API/Test Comparison` on
**every** open PR until converged — including PRs touching no activesupport
runtime file.

Surfaced from PR #6647 (activemodel `validations_test` parity), whose only
activesupport changes are a new `assertNotPredicate` in
`testing/assertions.ts` plus its `index.ts` export, so it cannot and should not
baseline these.

Companion to `oid-array-constructor-omits-new-call` (same red, different
package — that one is #6633's three `oid/array.ts` rows).

## Acceptance criteria

- `Time#toFs` calls `strftime` on both branches and `formattedOffset` calls
  `isUtc` / `utcOffset`, matching conversions.rb, so all four rows disappear from
  `call-mismatches.json` without a baseline entry.
- `pnpm parity:api:calls` is green on `main` again.
- No row is added to `call-mismatches-exclude/` — the fix is to make the call. If
  one genuinely cannot be made, it needs a reviewed one-line `reason`, never the
  seeded placeholder.
- Any resulting stale high-water mark is narrowed with
  `pnpm parity:api:calls:tighten activesupport/time-ext.json`, never a reseed.
