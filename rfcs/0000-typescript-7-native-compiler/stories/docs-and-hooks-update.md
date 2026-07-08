---
title: "Update hooks/docs to reflect tsgo default"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["flip-build-to-tsgo"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 3 of RFC 0000-typescript-7-native-compiler. Reconcile the prose and
tooling with the new default compiler.

- `scripts/typecheck.mjs` — update the "~60s cold `tsc --build`" comment
  and any tsc-specific rationale.
- Pre-commit hook wiring (husky) — confirm it invokes the tsgo path.
- `CONTRIBUTING.md`, `CLAUDE.md`, `README.md` build/typecheck notes.
- Note: `docs/activerecord/` is frozen — if a stale mention lives there,
  record it in the PR body instead of editing.

## Acceptance criteria

- No committed prose/hook still describes `tsc --build` as the
  authoritative typecheck path (outside frozen `docs/activerecord/`).
- Pre-commit typecheck runs on tsgo.
