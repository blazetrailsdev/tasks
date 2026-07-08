---
title: "Route Model#_hashToXml nested-hash/array recursion through XmlMini.toTag (depth-aware builder + nested type threading)"
status: claimed
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 22
pr: null
claim: "2026-07-08T19:37:36Z"
assignee: "model-hashtoxml-route-nested-through-totag"
blocked-by: null
closed-reason: null
---

## Context

`xml-mini-to-tag-shared-helper` (PR #4752) ported `XmlMini.toTag` and routed
`Model#_hashToXml`'s **leaf** emission through it, but the **nested-hash** and
**array-of-objects** recursion still lives inline in `_hashToXml`
(`packages/activemodel/src/model.ts`, the `isPlainRecord(value)` and
`Array.isArray(value)` branches) rather than delegating to `toTag`'s
`emitHash`/`emitArray` (`packages/activesupport/src/xml-mini.ts`).

Two blockers kept these paths inline:

1. `_hashToXml` threads per-nested-attribute cast types via
   `typeInfo.nested[key]` (the adapter-agnostic `type=` for bigint ids /
   string-materialized decimals). `toTag` takes one `type` per value and has no
   channel to carry a whole nested `XmlTypeInfo` down.
2. The leaf builder passed into `toTag` implements `tag` only; its
   `openTag`/`closeTag` are no-ops, so `toTag`'s container recursion
   (`emitHash`/`emitArray`) cannot produce the indented output `_hashToXml`
   emits.

As a result `renameKey`/`type`/`nil` are funneled through `toTag` for leaves
only; nested wrappers still call `renameKey` directly in `model.ts`, so the
"single funnel" is partial.

## Acceptance criteria

- Give `XmlBuilder` a depth/indentation-aware implementation (or teach the
  existing sink to track nesting) so `toTag`'s `emitHash`/`emitArray` produce
  the same indented XML `_hashToXml` emits today.
- Provide a channel for per-nested cast types (e.g. thread `XmlTypeInfo` through
  the `toTag` options, or resolve types before descending) so nested bigint/
  decimal attributes keep their adapter-agnostic `type=`.
- Route `_hashToXml`'s nested-hash and array-of-objects branches through `toTag`
  so `renameKey` has a single call site.
- No serialization/`test:compare`/`api:compare` regression; existing
  `serialization.test.ts` and `delegation.test.ts` XML assertions stay green.
