---
title: "Add pinned @typescript/native-preview + typecheck:native script"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["spike-tsgo-build-activerecord"]
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

Phase 1 of RFC 0000-typescript-7-native-compiler. Bring tsgo into the repo
as an opt-in, non-authoritative tool.

- Add `@typescript/native-preview` as a pinned root devDependency (exact
  version, not a range — it is a fast-moving pre-GA package).
- Add a `typecheck:native` script running `tsgo --build` over the same
  root graph `pnpm typecheck` uses.
- Do NOT touch `pnpm build` / `scripts/typecheck.mjs` — `tsc` stays the
  source of truth through Phase 2.
- Keep the existing `typescript` 5.x devDep untouched: `trails-tsc` and
  `activerecord-cli`'s tsc-wrapper depend on its programmatic API and are
  out of scope for the swap.

## Acceptance criteria

- `pnpm typecheck:native` runs `tsgo --build` and is documented.
- `pnpm build` / `pnpm typecheck` behavior is unchanged.
- The native-preview version is pinned exactly.
