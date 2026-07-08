---
title: "Spike: get the TS 7 tsc --build to complete on the AR graph"
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
before any CI wiring: prove the TS 7 `tsc --build` can actually _complete_
on the real project graph, and inventory every divergence. (TS 7.0 GA'd
2026-07-08 as the `typescript` package; the slug's "tsgo" is historical.)

- Run the TS 7 `tsc --build` from the root `tsconfig.json` (composite, 15
  refs, `module`/`moduleResolution: Node16`, `strict`, `isolatedModules`,
  `declaration`+`declarationMap`+`sourceMap`).
- Capture the full diagnostic set and compare against the TS 5.x
  `tsc --build`: missing errors, spurious errors, message-text reworders.
- Enumerate TS 7 breaking-default hits against our config — especially the
  new `types: []` default (was `["*"]`), which can drop ambient `@types/*`;
  also confirm `rootDir`/`target`/module-kind assumptions still hold.
- Diff emitted `.d.ts` for a sampled set of public entry points — TS 7
  documents declaration emit as intentionally different, and every package
  ships `types`, so consumer-visible shape changes must be found now.
- File upstream bugs for any non-intentional divergence; seed the parity
  allowlist consumed by `typecheck-parity-script`.

## Acceptance criteria

- The TS 7 `tsc --build` completes on the full graph (or the blocking
  failure is filed upstream and this RFC is recorded as stalled at Phase 0).
- A seed allowlist of understood diagnostic + `.d.ts` + breaking-default
  divergences exists for `typecheck-parity-script` to consume.
