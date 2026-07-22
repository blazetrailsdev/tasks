---
title: "predications.trails.test.ts Map test iterates .keys(), not a Map"
status: in-progress
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 53
pr: 5051
claim: "2026-07-22T01:56:47Z"
assignee: "arel-predications-trails-map-test-uses-keys-iterator"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/predications.trails.test.ts` (added by #5005) has a test
named "expands a Map through the Enumerable arm" that passes
`new Map([[1, 2]]).keys()` — a `Map Iterator`, not a `Map`. It therefore
exercises the same code path as the neighbouring generator test and never
touches the Hash analogue the name implies.

This matters because the Map case is load-bearing for a documented decision.
Ruby's `Hash` IS `Enumerable`, so `in({a: 1})` expands to
`[Casted([:a, 1], self)]` (`arel/predications.rb:65-74`). trails maps that arm
onto a JS `Map`, which expands into PAIRS, while an object literal is the
`Object.new` analogue and casts whole — the split documented at the
`isEnumerable` guard in `predications.ts`.

PR #5004 added a correct "expands a Map into pairs, matching Ruby's Enumerable
Hash" test alongside it on both the mixin and `Attribute` paths, so the
behaviour IS covered. What remains is the misleading older test: a future
reader (or a coverage audit) can reasonably read its name as pinning the Hash
analogue when it does not.

This is a trails-only test file, so renaming is permitted — the CLAUDE.md rule
against renaming tests protects Rails-mirrored names used by `test:compare`,
and this file has no Rails counterpart (in Ruby a Set, a Hash and a lazy
enumerator are all simply `Enumerable`).

## Acceptance criteria

- [ ] The `.keys()` test is renamed to say what it exercises (an iterator taken
      off a Map), or folded into the generator test.
- [ ] The Hash-analogue pair-expansion coverage added by #5004 remains the test
      that carries the "Map" name.
- [ ] test:compare delta non-negative (trails-only file; no Rails pairing).
