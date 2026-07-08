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

Phase 4 of RFC 0000-typescript-7-native-compiler. Once tsgo has been the
authoritative default through a stable period, remove the redundant TS 5.x
batch run.

- Remove the old `tsc --build` batch typecheck from CI and hooks.
- Keep `scripts/typecheck-parity.mjs` runnable on demand (a diagnostic
  tool), but drop it from the required CI path.
- Do NOT remove the `typescript` 5.x dependency here — that is scoped by
  the sibling `contain-typescript-5x-dependency` story.

## Acceptance criteria

- No `tsc --build` batch typecheck remains in required CI or pre-commit.
- Parity script still runs on demand.
