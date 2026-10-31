---
title: "Records answer method_missing through a Proxy in the prototype chain"
status: draft
updated: 2026-10-31
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "Records are not Proxies" rules out a Proxy on records on cost: 3.7x on an attribute read and 64x on an internal field read. Those figures measure a Proxy returned from the constructor. A spike on 2026-10-30 spliced a Proxy above `Model.prototype`, with a placeholder layer as in `packages/activerecord/src/relation.ts` (`_placeholderFields`), and removed the alias loop in `instantiateInstanceOf` (`packages/activerecord/src/persistence.ts:968`). Alternating benchmarks on `examples/twelve-dollar-server` (best of three, CPU µs per request, three rounds): `/posts/250000` base 1,398 / 1,330 / 1,411 against spike 1,341 / 1,363 / 1,433; `/feed` base 1,741 / 1,800 / 1,823 against spike 1,750 / 1,720 / 1,693.

Six test files gave 972 passed, 1 failed: `AttributeMethodsTest > custom field attribute predicate`, since the spike's trap only checks `_attributes.isKey`. Rails: `activerecord/lib/active_record/attribute_methods.rb` `respond_to_missing?` and `activemodel/lib/active_model/attribute_methods.rb:511-533` `method_missing`.

Limit: a read of an undefined name still answers `undefined`, as `typeof x.m` probes and `then` require (CLAUDE.md rule for Proxy rows), so `NoMethodError` on a read stays out of reach.

## Acceptance criteria

- The repo owner rules on changing § "Records are not Proxies" before merge; the section is rewritten to match.
- A record is not a Proxy, and only a missed name reaches a Proxy in its prototype chain, tested.
- The trap goes through `respond_to_missing?` / `method_missing`, so predicates and dirty suffixes on a selected alias work, and a reader removed by `undefineAttributeMethods` regenerates on read.
- The `instantiateInstanceOf` loop is gone, which supersedes `record-load-skips-basic-obj-respond-to-per-record`.
- `await record`, `toJSON` and `typeof` probes stay fast: `/feed` and `/posts` CPU per request do not regress, with a `@perf` tag on the machinery.
- Application-model fields assigned after construction do not slow down, benchmarked.
