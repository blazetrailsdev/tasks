---
title: "async-inference"
status: closed
updated: 2026-07-17
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike PR #4912 closed — deterministic codegen not useful enough for the backlog; direction abandoned."
---

## Context

The generator emits synchronous method bodies. Many trails ports are
`async`/`await` because they issue DB round-trips (e.g.
`packages/activerecord/src/relation/calculations.ts` `pluck`/`count` are async;
Rails `vendor/rails/activerecord/lib/active_record/relation/calculations.rb`
is sync). `scripts/prism-codegen/handlers/structure.ts` `emitDef()` always
emits a plain function.

## Acceptance criteria

- Seed a known-async method manifest from the api-compare TS surface (which
  already knows which trails methods are async).
- Mark a generated `def` `async` when its name (or a call it makes) is in the
  manifest; prefix awaited calls with `await`.
- Document the propagation heuristic and its false-positive/negative modes in
  the RFC.
