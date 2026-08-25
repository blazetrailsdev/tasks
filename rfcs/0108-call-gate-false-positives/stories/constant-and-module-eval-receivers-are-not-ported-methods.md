---
title: "Drop core calls on literal-constant and module_eval receivers from the call gate"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6689
claim: "2026-08-18T12:07:58Z"
assignee: "wave-4e-schema-dumper-migration-residue"
blocked-by: null
closed-reason: null
---

## Context

Measured while landing `core-receiver-calls-in-core-ext-are-not-ported-methods`
(PR #6680), which drops a Ruby core/stdlib call made inside a `core_ext/**` body
or on a Ruby core CLASS constant from the call gate
(`scripts/api-compare/extract-ruby-api.rb`, `core_receiver_call?` /
`core_class_receiver?` / `core_ext_file?`).

Three false positives of the SAME class survive that verdict, because their
receiver is neither implicit `self` in a `core_ext/**` file nor a core class
constant. They remain baselined under `call-mismatches-exclude/activesupport/`:

- `transliterate.json` — `transliterate` / `include?`:
  `activesupport/lib/active_support/inflector/transliterate.rb:66` calls
  `ALLOWED_ENCODINGS_FOR_TRANSLITERATE.include?(string.encoding)`. The receiver
  is a CONSTANT whose value is a frozen Array literal in the same file
  (`transliterate.rb:12`), so the call is `Array#include?`, matched by name
  against a ported trails `include?`.
- `xml-mini/nokogiri.json` — `parse` / `first`:
  `activesupport/lib/active_support/xml_mini/nokogiri.rb:19-30` calls `.first`
  on the parsed document — `Enumerable#first`, matched against
  `Relation#first` / `Querying.first`.
- `deprecation/method-wrappers.json` — `deprecate_methods` /
  `define_method` and `/ redefine_method`:
  `activesupport/lib/active_support/deprecation/method_wrappers.rb:35-49`
  calls both UNQUALIFIED inside a `Module.new { … }` / `module_eval` block, so
  `self` there is the anonymous module — Ruby metaprogramming, not a ported
  trails method — but the file is not under `core_ext/`, so `core_ext_file?`
  is false.

## Converged shape

Extend the same `inert_receiver?` / `core_receiver_call?` machinery rather than
adding a new mechanism:

- a CONSTANT receiver whose value the extractor already knows to be an Array or
  Hash literal (`@file_constants` records literal values, see
  `extract-ruby-api.rb#process_file`) is inert for a Ruby core method name —
  the same argument the existing `INERT_RECEIVER_LITERALS` makes for a literal
  written in place;
- inside a `Module.new { … }` / `module_eval` / `class_eval` block, `self` is a
  Ruby Module, so a `Module`-core method name (`define_method`,
  `redefine_method` is ActiveSupport's own core_ext on Module,
  `attr_reader`, …) is Ruby metaprogramming, not a ported collaborator.

Both verdicts must reach BOTH call sites (`walk_for_calls` and
`record_call_site`) so the call-set and call-argument gates keep agreeing, and
each needs a unit test in `extract-ruby-api.test.ts` pairing a dropped core call
with a genuine ported call on the same receiver.

## Acceptance criteria

- The three shards above lose their rows by CONVERGENCE (the gate stops
  reporting the call), not by re-justification.
- Stale high-water marks lowered with `pnpm parity:api:calls:tighten <shard>`,
  never a reseed.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; no new
  baseline row is added.
- Unit tests cover a dropped core call and a genuine ported call on the same
  receiver, for both new verdicts.
