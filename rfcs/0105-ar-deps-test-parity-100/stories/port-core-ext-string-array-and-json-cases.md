---
title: "Port core_ext/string_ext, array/conversions and json/encoding cases (18)"
status: in-progress
updated: 2026-09-06
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "triage-activesupport-in-closure-skip-stubs"
deps-rfc: []
est-loc: 200
priority: null
pr: 7578
claim: "2026-09-06T22:39:59Z"
assignee: "port-core-ext-string-array-and-json-cases"
blocked-by: null
closed-reason: null
---

## Context

These files are **in the AR require-closure** by the manifest from
`derive-ar-closure-test-manifest` — activesupport code ActiveRecord and
ActiveModel actually load — so they are on the critical path for this RFC's
`activesupport 100%`. Measured 2026-08-13 with
`pnpm parity:test -- --cached --package activesupport`:

- `vendor/rails/activesupport/test/core_ext/string_ext_test.rb` — 5 remaining — 4 stubs, 1 missing
- `vendor/rails/activesupport/test/core_ext/array/conversions_test.rb` — 12 stubs
- `vendor/rails/activesupport/test/json/encoding_test.rb` — 1 stub

Scope after `triage-activesupport-in-closure-skip-stubs` (2026-09-01): 11 of
`string_ext`'s stubs converged in sibling work and `emits normal string YAML`
is now a Psych exclusion; 10 of `json/encoding`'s 11 are exclusions
(`Process::Status`, Ruby `Encoding`, `Struct`, `Data`, the `json` gem's
`to_json(state)` protocol, `IO`), leaving only
`twz to json when wrapping a date time`. `array/conversions`' 12 are all
`to_xml` and all ports, sharing `core_ext/hash/conversions.rb` with
`port-core-ext-hash-ext-remaining-cases`.

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
