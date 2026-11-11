---
title: "cache-marshal-serializers-dump-through-ruby-compat-marshal"
status: draft
updated: 2026-11-11
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Marshal70WithFallback` / `Marshal71WithFallback` and `SerializerWithFallback#marshal_load`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/serializer_with_fallback.rb:38-43`)
call `Marshal.dump` / `Marshal.load`. trails' `packages/activesupport/lib/cache/serializer-with-fallback.ts:121-172`
still calls the JSON stand-in `coder` (`lib/cache/coder.ts:121-130`), although ruby-compat now ships a real
`Marshal` (`packages/ruby-compat/lib/marshal.ts:1552`, trails#8349). `marshalLoad` rescues `SyntaxError`
where Rails rescues `ArgumentError` (Marshal's "undefined class/module").

Consequences, shown by `test/cache/behaviors/cache-store-format-version-behavior.ts` (parked `it.skip`, `BLOCKED:` this story):

- "format version 7.0 uses correct signature for uncompressed entries": the 7.0 payload starts `\x00{` not `\x00\x04\x08[`.
- "Marshal undefined class/module deserialization error with … format" and the "Compressed" variant: an instance of a
  class does not round-trip (JSON reads back `{}`), and a removed constant never raises.

A trial swap of `coder.dump/load` for `Marshal.dump/load` in serializer-with-fallback.ts reds 16 cache tests: Marshal
loads a Hash as a `Map` (tests expect plain objects), `Time`/`Date` have no `_dump_data`, and `undefined` reads back
`null`. Those need converging alongside (Marshal load of a Hash into a plain object per ruby-compat README's Hash rule,
Time `_dump`).

## Acceptance criteria

- [ ] serializer-with-fallback.ts dumps/loads through ruby-compat `Marshal`; `marshalLoad` rescues `ArgumentError` → `DeserializationError`.
- [ ] The three parked cases in cache-store-format-version-behavior.ts are un-skipped and pass.
- [ ] Existing cache tests (`packages/activesupport/test/cache/**`) stay green.
