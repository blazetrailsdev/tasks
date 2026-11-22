---
title: "activesupport-api-misses-remainder-2"
status: ready
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps:
  - activesupport-api-misses-remainder-after-bundle
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activesupport-api-misses-remainder-after-bundle` after its PR, from
`pnpm parity:api --package activesupport --missing`:

- `cache/coder.rb` `LazyEntry#value` / `mismatched?`: `lib/cache/coder.ts` `lazyEntryClass` is a lazy
  class expression because of the `entry.ts` <-> `coder.ts` cycle. `entry.ts` uses the invented
  `coder` JSON object where `cache/entry.rb:68-128` calls `Marshal.dump` / `Marshal.load`. Swapping to
  ruby-compat `Marshal` breaks the cycle but round-trips a plain object as a `Map`
  (`serializer-with-fallback.test.ts` ":passthrough serializer can compress entries" reds), so that
  needs deciding first.
- `core_ext/date_time/compatibility.rb#to_time`, `core_ext/date_time/conversions.rb#inspect`,
  `core_ext/time/compatibility.rb#to_time`, `core_ext/time/calculations.rb#at`,
  `core_ext/hash/conversions.rb#to_xml`, `core_ext/object/with.rb#with`,
  `core_ext/thread/backtrace/location.rb#spot` (✗).
- `json/encoding.rb` `encode`/`dump`; `current_attributes.rb:186-192#method_added`;
  `encrypted_configuration.rb:41-43` `InvalidKeyLengthError#message`;
  `execution_wrapper.rb:10-11` `Null.complete!` (TS has it as `static Null = { completeBang }`, uncredited);
  `xml_mini/rexml.rb:41-43#require_rexml`.
- `TestCase.parallelize` (`test_case.rb:81-86`) is unported.

## Acceptance criteria

- [ ] Each member above is ported onto its Rails owner, or receipted under a named CLAUDE.md section.
- [ ] Every file above reaches 100% in `parity:api`, and no ✗ file is left.
