---
title: "Phase 4 — Verification and cleanup"
status: done
updated: 2026-06-10
rfc: "0017-arel-collector-threading"
cluster: arel-collector-threading
deps:
  - p3-subclass-threading
deps-rfc: []
est-loc: 50
priority: 4
pr: 3080
claim: "2026-06-10T11:55:13Z"
assignee: "p4-verification"
blocked-by: null
---

## Context

Confirm the full conversion is clean end-to-end. No behavior change is expected
— the conversion is structural. This story is the checkpoint before the RFC is
closed.

See RFC §Rollout Phase 4.

## Acceptance criteria

- [ ] All arel visitor test files pass locally:
      `pnpm vitest run packages/arel/src/visitors/`
- [ ] `pnpm vitest run packages/arel/` fully green
- [ ] CI passes (full suite runs on push — do not run locally)
- [ ] `this.collector` and `_extractBinds` do not appear anywhere in
      `packages/arel/src/visitors/to-sql.ts`, `mysql.ts`, `postgresql.ts`,
      or `sqlite.ts`
- [ ] No `visit(node): SQLString` override remains in `to-sql.ts` (the base
      `Visitor.visit` dispatches correctly)
- [ ] `api:compare` arity delta noted in PR description: ~123 previously
      advisory arity mismatches (`visit_X(o, collector)` vs `(node)`) now resolved
      as a side-effect of threading

## Notes

This story should be small — if CI is green after Phase 3, this phase is just
a confirmation PR adding the verification note. If CI surfaces failures, diagnose
in this story rather than reopening Phase 2 or 3.

The `api:compare` arity resolution is a **side-effect**, not the goal. The PR
description should say so explicitly so reviewers understand the motivation.
