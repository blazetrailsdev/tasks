---
title: "activesupport: port remaining Cache::Coder surface + SerializerWithFallback"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`cache-serialization-marshal-vs-json` (PR #3648) implemented the fidelity
`dump`/`load` core but only the minimal surface. `api:compare` shows
`cache/coder.ts` at 2/9 and `cache/serializer_with_fallback.ts` at 0/7.

Rails' `Cache::Coder` (vendor/rails/activesupport/lib/active_support/cache/coder.rb)
additionally provides: `dump_compressed(entry, threshold)`, the binary signature
framing (SIGNATURE, type/expires_at/version_length packing), `LazyEntry`
(lazy deserialize/decompress), string-encoding fast paths, and version packing.
`cache/serializer_with_fallback.rb` (the multi-format loader with graceful
fallback on unrecognized payloads) is still a stub —
`serializer-with-fallback.test.ts` is entirely `it.skip`.

## Acceptance criteria

- [ ] Port the remaining `Cache::Coder` surface (dump_compressed, LazyEntry,
      signature/version framing) atop the fidelity serializer, or document the
      portions that are deliberately N/A for the trails (non-Ruby-wire) format.
- [ ] Implement `SerializerWithFallback` and un-skip its tests, or convert the
      skips to real coverage matching the Rails test names.
