---
title: "Relation#clone still copies most keys by property descriptor"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [activerecord]
deps: [relation-clone-without-property-descriptors]
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10094 gave `Relation#clone` a fast path
(`packages/activerecord/lib/relation.ts:1701`) that copies placeholder fields
directly. Every other own key still goes through
`Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(this, key))`,
and each key in the fast path runs `_isPlaceholderField`, a walk up the
prototype chain.

Under the twelve-dollar load, after #10094:

- `getOwnPropertyDescriptor` is **6.3% of allocated bytes**, almost all under
  `spawn` from `select`, `joins`, `limit`, `where` and `order`.
- `clone` is **3.0% of busy CPU** in self time, and `_isPlaceholderField` is
  another **1.1%**.

Each request runs about five clones, one per scope step.

## Acceptance criteria

- [ ] List which own keys of a scoped relation take the descriptor path, and why.
- [ ] Copy those keys directly too, or classify them once per prototype instead of
      once per clone, keeping the semantics of accessors that were cloned.
- [ ] `getOwnPropertyDescriptor` falls below 1% of bytes, and `clone` plus
      `_isPlaceholderField` fall below 1.5% of busy CPU.

## Verification

Run the slim profile harness from the RFC README's Verification section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
