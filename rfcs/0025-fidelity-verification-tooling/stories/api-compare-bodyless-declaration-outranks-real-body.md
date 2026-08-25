---
title: "Bodyless exported declarations outrank real bodies in call-parity pairing, silently retiring baselined rows"
status: draft
updated: 2026-08-21
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing #6798 (`retire-activemodel-this-rebinding-thunks`).

The TS extractor emits an entry under `packages.<pkg>.modules` for every
**exported** interface, type alias, and object-literal const, listing its
members as `instanceMethods`. When such a declaration lives in a Rails-matched
file and its member names are Rails method names, the matcher pairs the Rails
member with that **bodyless declaration** instead of with the file's real
`export function` body in `fileFunctions`.

A declaration has no `calls` / `callArgs`, so every call-parity finding for that
method silently disappears — `parity:api:calls` and `parity:api:calls:args`
report the corresponding baseline rows as STALE, and the only sanctioned remedy
(delete the row) permanently retires a live divergence that was never fixed.

Measured on #6798. Adding the ClassMethods surface to the exported
`AttributeMethodHost` in
`packages/activemodel/src/attribute-methods.ts` retired:

- `resolve_attribute_name` / `fetch` (call-set) — Rails
  `attribute_methods.rb:396-398` `attribute_aliases.fetch(super, &:itself)`
- `attribute_method_patterns_cache` / `new(kwargs{initialCapacity=num:4})`
  (call-args) — Rails `attribute_methods.rb:418`
  `Concurrent::Map.new(initial_capacity: 4)`

and exporting `ClassMethods` / `InstanceMethods` object literals of function
_references_ additionally retired:

- `attribute_method?` / `attributes` and `attribute_method?` /
  `respond_to_without_attributes?` — Rails `attribute_methods.rb:541-542`

All four are real, unfixed divergences. Confirmed by A/B: making the same
declarations **non-exported** (a local type alias is not extracted) restored
every row. #6798 shipped with the host types local for exactly this reason, and
says so in the PR body — a workaround, not a fix.

The gate is only-shrink by construction, so this defect converts "someone
exported a type" into "a baselined divergence is gone forever", with no signal
at any point.

## Acceptance criteria

- When a Rails member can pair with both a bodyless TS declaration (interface
  member, type-alias member, object-literal const member) and a real body
  (`fileFunctions` entry, class method), the extractor/matcher prefers the one
  that **has a body**.
- A regression test over a fixture pair reproducing the
  `attribute_method_patterns_cache` case: exporting a type alias naming the
  method must not change the call-set or call-args findings for it.
- Re-exporting `ClassMethods` / `InstanceMethods` from
  `packages/activemodel/src/attribute-methods.ts` (or re-adding the method
  members to `AttributeMethodHost`) reproduces all four rows above rather than
  staling them.
- No baseline reseed: the four rows are already in
  `scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json`
  and must still be reported after the fix.
