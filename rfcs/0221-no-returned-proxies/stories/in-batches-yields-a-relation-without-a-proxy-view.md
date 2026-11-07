---
title: "in-batches-yields-a-relation-without-a-proxy-view"
status: draft
updated: 2026-11-07
rfc: "0221-no-returned-proxies"
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

trails#9821 replaced `stripThenable`'s returned Proxy with an own `then` getter that answers `undefined` once and then removes itself. That covers every caller where the value meets exactly one promise `resolve`.

Two sites still return a Proxy view: the `inBatches` block yields in `packages/activerecord/src/relation/batches.ts` (`batchOnLoadedRelation` and `batchOnUnloadedRelation`, the `await block(...)` lines). A blockless `inBatches()` hands each batch relation through an async-generator `yield` (`batches.ts`, the `generator` that `BatchEnumerator#_generator` holds). It then goes through ruby-compat `AsyncEnumerable#first` / `#reverseEach` (`packages/ruby-compat/lib/enumerable.ts`, `reverseEach`'s inner generator). Each of those steps re-reads `then`, so a one-read shadow is used up and the batch is adopted as its records. `batches.test.ts` shows it: "in batches should start from the start option", "in batches should end at the finish option", "in batches enumerator should quote batch order with desc order".

Rails: `relation/batches.rb` `in_batches` yields a Relation (`batches.rb:420-424`). Ruby has no thenables.

## Acceptance criteria

- [ ] The batches yield sites hand on the original relation (`===`), with no Proxy.
- [ ] A batch relation reached through `inBatches().first()` and `.reverseEach().first()` is a `Relation`, not its records. The three `batches.test.ts` tests above pass.
- [ ] The module-private Proxy view in `batches.ts` is deleted.
