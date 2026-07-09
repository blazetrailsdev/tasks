---
title: "Serialized#isChanged: distinct NaN Hash values compare unequal (Ruby NaN non-reflexivity)"
status: ready
updated: 2026-07-09
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4817 made `canonicalKey` in `packages/activerecord/src/type/serialized.ts`
tag `undefined`/`NaN`/`+/-Infinity` with a NUL-prefixed sentinel so a
serialized Hash value distinguishes them from `null` (matching Ruby `Hash#==`).

One residual divergence remains: because `canonicalKey` is a _deterministic_
string, two DISTINCT `NaN` values canonicalize identically and so compare
EQUAL in `Serialized#isChanged`. Ruby's `Float::NAN == Float::NAN` is `false`,
so `{a: Float::NAN} == {a: Float::NAN}` is `false` and would report changed.
Trails reports unchanged.

This only manifests for in-memory reassignment — JSON coders cannot round-trip
`NaN` across a DB save — so it is rare. PR #4817 documented it in the
`NONSERIALIZABLE_SENTINEL` doc comment and pinned it with the test
"documents that two distinct NaN Hash values compare equal (JSON limitation)"
in `serialized.trails.test.ts`.

Rails ref: `vendor/rails/activemodel/lib/active_model/type/value.rb`
(`changed?` -> `old_value != new_value` -> `Hash#==` -> element `==`).

## Acceptance criteria

- `Serialized#isChanged` reports a change when an old serialized Hash value
  contains `NaN` and the new one contains `NaN` at the same key (distinct
  values), matching Ruby's non-reflexive `Float::NAN == Float::NAN`.
- Converging requires abandoning pure string-canonicalization equality for the
  `NaN`-bearing case (a deterministic key cannot express non-reflexivity) —
  e.g. a structural deep-equal that special-cases NaN, without regressing the
  order-insensitive Hash#== and default-detection behavior canonicalKey backs.
- Update/replace the pinning test that currently documents the divergence.
- No regression in serialized-attribute or dirty suites.
