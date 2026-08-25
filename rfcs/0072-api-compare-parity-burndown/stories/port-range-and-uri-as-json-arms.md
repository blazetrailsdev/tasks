---
title: "Port Range#as_json and URI::Generic#as_json, the two remaining arms with a JS analogue"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6214
claim: "2026-08-08T01:26:09Z"
assignee: "connection-pool-disconnect-returns-before-the-driver-drains"
blocked-by: null
closed-reason: null
---

## Context

PR #6209 added the `Module`, `BigDecimal` and `Enumerable` `as_json` arms to
`packages/activesupport/src/core-ext/object/json.ts`. Two of the remaining
unported arms have a real JS analogue and were left out only because the
dispatcher cannot discriminate them today:

- **`Range#as_json`** — `vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:157-161`
  (`to_s`). Rails' own case list expects `1..2` to encode as `"1..2"`
  (`vendor/rails/activesupport/test/json/encoding_test_cases.rb:86-88`).
  trails' `Range` (`packages/activesupport/src/range-ext.ts:23`) is a bare
  `interface { begin, end, excludeEnd }`, so a range value is a plain object and
  reaches the `Hash` arm — it currently encodes as `{"begin":1,"end":2,...}`,
  not `"1..2"`. `Range#to_s` already exists as the private `toS` in
  `core-ext/range/conversions.ts:30-34`.

- **`URI::Generic#as_json`** — `json.rb:230-234` (`to_s`). JS `URL` is the
  analogue and is discriminable with `instanceof`.

Still genuinely analogue-less and out of scope: `Data`, `Struct`, `IO`,
`Pathname`, `Process::Status`. `Symbol#as_json` (`json.rb:104-108`) is covered
by the `String` arm — a Ruby Symbol is a JS string per CLAUDE.md.

## Converged shape

`static asJson` per Ruby class in `core-ext/object/json.ts`, in Rails' file
order, plus its dispatcher branch ordered most-specific first.

`Range` needs a runtime discriminator before its arm can be reached — either a
first-class `Range` class in `range-ext.ts` (which `validations/clusivity.ts:177`
and `validations.ts:420` already note the absence of), or an exported
`isRange()` predicate over the interface shape. Pick one and reuse
`core-ext/range/conversions.ts`'s `toS` for the body rather than re-deriving
`"1..2"`.

## Acceptance criteria

- [ ] `Range#as_json` and `URI::Generic#as_json` are ported as classes of the
      Ruby name with `static asJson`, bodied from `json.rb:157-161` and `:230-234`.
- [ ] `ActiveSupportJSON.encode(makeRange(1, 2))` emits `"1..2"` and
      `encode(makeRange(1, 2, true))` emits `"1...2"`
      (`encoding_test_cases.rb:86-88`).
- [ ] The `Range` body calls the existing `Range#to_s`, not a second copy.
- [ ] `pnpm parity:api --package activesupport` non-negative;
      `pnpm parity:api:extra --package activesupport` clean; `pnpm parity:api:calls` green.
