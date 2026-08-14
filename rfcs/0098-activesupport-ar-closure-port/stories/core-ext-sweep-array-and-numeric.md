---
title: "core-ext-sweep-array-and-numeric"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6454
claim: "2026-08-13T02:56:51Z"
assignee: "converge-number-converter-format-options"
blocked-by: null
closed-reason: null
---

## Context

Slot D: small core_ext files AR calls directly — array + numeric.

- `core_ext/array/access.rb` — NO TS FILE, 14 members: `from`, `to`, `including`, `excluding`, `without`, `second`…`fifth`, `forty_two`, `second_to_last`, `third_to_last`. AR lib uses `from`/`to` (15 grep hits) and `second_to_last` (4).
- `core_ext/array/extract_options.rb` — NO TS FILE, 7 members (`extract_options!`, `extractable_options?`): 20 AR call sites.
- `core_ext/numeric/bytes.rb` — NO TS FILE, 16 members (`bytes`…`exabytes` + singular aliases); AR uses `megabytes`.
- `core_ext/numeric/time.rb` — 7 remaining of 13 (`fortnights`, `in_milliseconds`, …).
- `core_ext/numeric/conversions.rb` — NO TS FILE, 2 members.
- `core_ext/integer/time.rb` — 2 remaining; `core_ext/array/conversions.rb` 3, `core_ext/array/extract.rb` 1, `core_ext/array/grouping.rb` 1.

Rails sources under `vendor/rails/activesupport/lib/active_support/`. ~55 members, audit slot ~240 LOC.

## Acceptance criteria

- Listed files at 0 missing; `parity:api` delta non-negative.
- Number-returning kwarg/predicate semantics match Ruby (no boolean-ification of value-returning predicates).

## Sweep note (2026-08-12)

Inventory drift since the 2026-08-10 audit — two "NO TS FILE" entries have
landed and should be re-measured rather than created:

- `packages/activesupport/src/core-ext/array/access.ts` EXISTS.
- `packages/activesupport/src/core-ext/numeric/bytes.ts` EXISTS.

Still absent, as the audit says: `core-ext/array/extract-options.ts` (note the
`extract-options.test.ts` beside it with no source) and
`core-ext/numeric/conversions.ts`. Re-run `pnpm parity:api --package
activesupport` for current missing counts before scoping the slot.
