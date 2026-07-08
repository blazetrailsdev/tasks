---
title: "Spike: get tsgo --build to complete on the AR graph"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 0 of RFC 0000-typescript-7-native-compiler. De-risk the migration
before any CI wiring: prove `tsgo --build` can actually _complete_ on the
real project graph, and inventory every divergence.

- Run `tsgo --build` from the root `tsconfig.json` (composite, 15 refs,
  `module`/`moduleResolution: Node16`, `strict`, `isolatedModules`,
  `declaration`+`declarationMap`+`sourceMap`).
- Capture the full diagnostic set and compare against `tsc --build`:
  missing errors, spurious errors, message-text reworders.
- Diff emitted `.d.ts` for a sampled set of public entry points — tsgo
  documents declaration emit as intentionally different, and every
  package ships `types`, so consumer-visible shape changes must be found
  now.
- File upstream bugs for any non-intentional divergence; seed the parity
  allowlist consumed by `typecheck-parity-script`.

## Acceptance criteria

- `tsgo --build` completes on the full graph (or the blocking failure is
  filed upstream and this RFC is recorded as stalled at Phase 0).
- A seed allowlist of understood diagnostic + `.d.ts` divergences exists
  for `typecheck-parity-script` to consume.
