---
title: "Add pinned TS 7 typescript + typecheck:native script"
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

Phase 1 of RFC 0000-typescript-7-native-compiler. Bring TS 7 into the repo
as an opt-in, non-authoritative tool. NOTE: TS 7.0 GA'd 2026-07-08 and
ships as the ordinary `typescript` package (the `@typescript/native-preview`
preview line is retired) — this story installs TS 7 _alongside_ the existing
pinned TS 5.x, so the slug's "native-preview" name is historical.

- Add a pinned TS 7 `typescript` (exact version) that resolves separately
  from the TS 5.x the API consumers need — e.g. via a pnpm aliased
  dependency (`typescript-7@npm:typescript@7.x`) so both `tsc` bins are
  reachable by explicit path.
- Add a `typecheck:native` script running the TS 7 `tsc --build` over the
  same root graph `pnpm typecheck` uses.
- Do NOT touch `pnpm build` / `scripts/typecheck.mjs` — the TS 5.x `tsc`
  stays the source of truth through Phase 2.
- Keep the TS 5.x dependency untouched: `trails-tsc` and `activerecord-cli`'s
  tsc-wrapper depend on its programmatic API, which TS 7.0 does not ship.

## Acceptance criteria

- `pnpm typecheck:native` runs the TS 7 `tsc --build` and is documented.
- `pnpm build` / `pnpm typecheck` behavior is unchanged.
- Both TypeScript versions are pinned exactly and resolve without collision.
