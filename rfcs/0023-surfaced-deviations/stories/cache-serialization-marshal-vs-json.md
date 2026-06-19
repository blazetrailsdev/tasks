---
title: "activesupport: converge cache serialization off JSON-for-Marshal deviation (Entry/Coder)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-19T14:36:26Z"
assignee: "cache-serialization-marshal-vs-json"
blocked-by: null
---

## Context

PR #3621 implemented `Cache::Entry` compression but had to serialize values with
`JSON.stringify`/`JSON.parse` because trails has no `Marshal` port. Rails uses
`Marshal.dump`/`Marshal.load` (`entry.rb:90,124`, and in `bytesize`/`dup_value!`).

JSON is a deviation: it cannot represent Ruby-Marshal payloads, loses type
fidelity (Dates, Symbols, undefined vs null, bigint), and is wire-incompatible
with any Marshal-encoded store. The compression path is internally consistent
(deflate JSON ⇄ inflate JSON) so it round-trips within trails, but it does not
match Rails' on-disk/serialized format and blocks the Marshal-dependent `Entry`
methods (see cache-entry-remaining-methods).

This is broader than `Entry`: `cache/coder.rb`, `cache/serializer_with_fallback.rb`,
and the cache stores all assume Marshal. Track here whether trails should (a)
build a Marshal-compatible serializer, (b) ratify JSON as the canonical trails
cache encoding, or — per project policy — always converge to Rails.

Rails source: `vendor/rails/activesupport/lib/active_support/cache/entry.rb:90,124`
TS files: `packages/activesupport/src/cache/entry.ts`, `cache/coder.ts`

## Acceptance criteria

- [ ] Decide and document the cache serialization strategy (converge to a
      Marshal-equivalent vs explicitly-ratified JSON encoding) consistently
      across `Entry`, `Coder`, and the stores.
- [ ] `Entry` compression serialization aligned with that decision.
- [ ] Unblocks the Marshal-dependent parts of cache-entry-remaining-methods.
