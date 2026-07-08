---
title: "Retire the tsc --build batch typecheck from CI/hooks"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["docs-and-hooks-update"]
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

Phase 4 of RFC 0000-typescript-7-native-compiler. Once the TS 7 `tsc` has
been the authoritative default through a stable period, remove the
redundant TS 5.x batch run. (The TS 7 `tsc --build` stays — it is now the
authoritative typecheck; only the TS 5.x one goes.)

- Remove the TS 5.x `tsc --build` batch typecheck from CI and hooks.
- Keep `scripts/typecheck-parity.mjs` runnable on demand (a diagnostic
  tool), but drop it from the required CI path.
- Do NOT remove the pinned TS 5.x `typescript` dependency here — that is
  scoped by the sibling `contain-typescript-5x-dependency` story.

## Acceptance criteria

- No TS 5.x `tsc --build` batch typecheck remains in required CI or
  pre-commit; the TS 7 `tsc --build` is the sole authoritative typecheck.
- Parity script still runs on demand.
