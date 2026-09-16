---
title: "Delegation#slice takes Ruby (start, length), not JS (start, end)"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Array#slice(start, length)` takes a length as its second argument, and `relation/delegation.rb:103` delegates `slice` to records. trails' `RECORD_DELEGATES.slice` in `packages/activerecord/src/relation/delegation.ts` calls JS `records.slice(start, end)`, which treats the second argument as an end index. So `rel.slice(1, 2)` returns one record where Rails returns two. This was carried over from the old `Relation#slice` body in trails#7809.

## Acceptance criteria

- `Delegation#slice` follows Ruby `Array#slice` semantics: `(index)` returns an element, `(start, length)` returns a subarray, a Range works, and out-of-range returns nil.
- The call sites and tests that rely on end-index semantics (`associations/collection-proxy.trails.test.ts` "slice returns a plain array shallow copy") are updated.
