---
title: "serializable_add_includes' collection arm bypasses each record's serializable_hash"
status: draft
updated: 2026-09-14
rfc: "0113-branch-and-guard-parity"
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

`activemodel/lib/active_model/serialization.rb:143-144` serializes a collection include as
`records.to_ary.map { |a| a.serializable_hash(opts) }` — each element is sent `serializable_hash`
and raises `NoMethodError` if it does not answer it.

After trails#7755 the singular arm in `packages/activemodel/src/serialization.ts`
(`serializableHash`'s `serializableAddIncludes` callback) sends `serializableHash(opts)` to the record,
but the collection arm still calls the module function
`serializableHash(r as SerializationRecord, opts, true)` on each element, bypassing the element's own
method and never raising for an element that lacks it. Converging it was left out because
`serialization.test.ts`'s `"include option with ary"` (and similar trails tests) feed fake
`{ _attributes: Map }` friends instead of Rails' `Person` models (`activemodel/test/cases/serialization_test.rb`).

## Converged shape

Collection arm: `items.map((a) => a.serializableHash(opts))` with a `NoMethodError` for an element
that does not respond, mirroring the singular arm; tests use real model instances as Rails' do.

## Acceptance criteria

- [ ] Collection arm dispatches `serializableHash(opts)` on each element per `serialization.rb:144`.
- [ ] `serialization.test.ts` include tests use model instances, names unchanged.
- [ ] `parity:api:calls` / `parity:test` non-negative.
