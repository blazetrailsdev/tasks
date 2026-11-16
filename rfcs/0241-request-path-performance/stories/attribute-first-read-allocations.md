---
title: "First read of a loaded attribute allocates a closure, a lazy attribute and a hash entry"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [activemodel, ruby-compat]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Serialising 20 posts reads each of their attributes once. Every first read
goes through `AttributeSet::Builder#fetchValue`
(`packages/activemodel/lib/attribute-set/builder.ts:87`) and then
ruby-compat's `fetch` (`packages/ruby-compat/lib/hash.ts:82`), passing an
`rbBlock` closure that builds the lazy attribute. So each read allocates a
closure, a block wrapper and an `Attribute`.

Under the twelve-dollar load:

- the attribute reader `get` (`attribute-methods/read`) is **5.2%** of
  allocated bytes;
- the builder's block is **3.9%**;
- `fetch` is **3.0%**, and `fetch` is also **2.4% of busy CPU**.

Almost all of it sits under `asJson` → `jsonify` while rendering the feed.
Rails' `LazyAttributeSet#fetch_value`
(`activemodel/lib/active_model/attribute_set/builder.rb:41`) does the same lazy build, but a Ruby
block costs nothing to pass.

## Acceptance criteria

- [ ] The first read of a database-loaded attribute allocates no closure: the
      builder looks the value up directly and builds the attribute without going
      through a block-taking `fetch`.
- [ ] `default_attributes` fallback and missing-attribute errors behave as before,
      and the activemodel attribute-set tests stay green.
- [ ] The three sites together fall below 4% of allocated bytes.

## Verification

Run the slim profile harness from the RFC README's "Slim profile harness" section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
