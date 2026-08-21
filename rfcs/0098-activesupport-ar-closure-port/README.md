---
rfc: "0098-activesupport-ar-closure-port"
title: "activesupport AR-closure porting"
status: active
created: 2026-08-10
updated: 2026-08-21
owner: "@your-handle"
packages:
  - "activesupport"
clusters: []
related-rfcs:
  - "0072-api-compare-parity-burndown"
  - "0092-parity-tools-consolidation"
priority: 2
---

# activesupport AR-closure porting

## Problem

activesupport sits at 46.9% API parity (1,075/2,292, main 5c54182f1) and is the only AR-dependency package below 100%. The audit `~/.btwhooks/data/github/blazetrailsdev/trails/audits/activesupport-ar-gaps-20260810T143915Z.md` (2026-08-10) cross-referenced every missing member against the `require "active_support/…"` closure of `vendor/rails/activerecord/lib` + `vendor/rails/activemodel/lib`: **518 missing members in 64 files are inside the closure** and are the AR-necessary work; the other 699 are out of scope (excluded via `0072/activesupport-out-of-closure-unported-entries`; non-portable in-closure members triaged into SKIP_GROUPS via `0072/activesupport-closure-skip-groups-triage`).

This RFC owns porting the in-closure remainder. The dominant cluster is the `DateAndTime::Calculations` mixin surface, counted once per receiver ≈ 249 members (~48% of the 518): the mixin file itself (63) plus its Time copy (attributed by the compare to `core_ext/object/blank.rb`, 67), Date copy (attributed to `core_ext/date/acts_like.rb`, 66), and the Time/DateTime-specific calc remainders (29 + 24). One mixin implementation wired onto Date/Time/DateTime credits all of them. Much of the underlying logic already exists in `@blazetrails/date` — reuse it; the parity credit requires the members at the activesupport paths.

## Approach

Nine slots, each a standalone ~220–280 LOC PR from main (no stacking). Rails sources under `vendor/rails/activesupport/lib/active_support/`. Every port follows CLAUDE.md fidelity rules: Rails names, control flow, decomposition; deviations only for genuine TS shortcomings, justified at the call site.

Direct AR/AM call-site evidence (grep of vendor AR/AM lib): `blank?/present?` 64+20 sites, `extract_options!` 20, `Array#from/to` 15, `deep_dup` 10, `try` 10, `stringify_keys` 10, `symbolize_keys` 9, `change` 11, `acts_like?` 7, `second_to_last` 4, `ago` 4, `in_time_zone` 2, `megabytes` 1. Test-axis: `assert_called` used by 30 AR test files, `travel_to` by 6.

## Stories

- date-and-time-calculations-predicates-and-day-arithmetic (Slot A)
- date-and-time-calculations-week-month-quarter-year (Slot B)
- time-and-date-time-specific-calculations (Slot C)
- core-ext-sweep-array-and-numeric (Slot D)
- core-ext-sweep-hash-module-string (Slot E)
- time-with-zone-and-duration-residue (Slot F)
- deprecation-and-logging-internals (Slot G)
- testing-helpers-for-ar-test-parity (Slot H)

(Slot I of the audit — SKIP_GROUPS triage — already filed under RFC 0072.)

## Changelog

### 2026-08-21 — the four in-closure XML conversions (option 1)

`resolve-the-in-closure-xml-conversions` asked which of three dispositions
resolves the contradiction between this RFC's measurement and RFC 0101's
"XmlMini is out-of-closure" framing. **Option 1 — port the minimum XmlMini
slice, inside 0098 — was chosen** (owner decision, backlog triage, recorded on
the story). Option 3 (re-deriving the closure) was not taken: the four members
really are reached by `scripts/api-compare/ar-closure.ts`'s transitive `require`
walk from `activerecord/lib` + `activemodel/lib`, so editing the closure would
have moved the denominator without a require-graph justification — which the
story explicitly forbids.

Landed in trails#6818. The four members are `Hash#to_xml`, `Hash.from_xml`,
`Hash.from_trusted_xml` (→ `hash-utils.ts`) and `Array#to_xml` (→
`array-utils.ts`). The XmlMini surface pulled in with them, and the boundary
this RFC now owns, is exactly:

- `XmlBuilder.instruct()` / `.target()` — the `Builder::XmlMarkup#instruct!` /
  `#target!` roles `Hash#to_xml` and `Array#to_xml` call directly
  (`core_ext/hash/conversions.rb:83`, `core_ext/array/conversions.rb:199`).
- An indent width on `IndentedXmlStringBuilder`, so `indent: 0` reproduces
  Builder's unformatted output.
- `ActiveSupport::XMLConverter` and its `DisallowedType` / `DISALLOWED_TYPES`
  (`core_ext/hash/conversions.rb:140-262`), which is `Hash.from_xml`'s whole
  body.

Nothing else in `xml_mini.rb` was touched; the backend/parsing half stays RFC
0101's. AR closure moved 8917/8943 → 8940/8948.

## Done means

Every in-closure activesupport file reports 0 missing members in `pnpm parity:api` (or its non-portable members carry SKIP_GROUPS reasons), and the "AR closure" rollup (`0092/ar-closure-rollup-in-parity-summaries`) reads 100%.
