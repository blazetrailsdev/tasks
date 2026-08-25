---
title: "Align compare entry-point and lint naming across the four compare dirs"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: ["extract-parity-tools-package"]
deps-rfc: []
est-loc: 200
priority: null
pr: 6274
claim: "2026-08-09T02:15:49Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

Naming drifted across the four compare dirs:

- Main entry is `compare.ts` in `scripts/api-compare/`,
  `scripts/fixtures-compare/`, `scripts/schema-compare/` — but
  `scripts/test-compare/test-compare.ts`.
- Lint entry points are `lint-<subject>.ts` in api-compare
  (`lint-call-mismatches.ts`, `lint-arity-excludes.ts`, ...) while
  test-compare splits `assertion-ratchet.ts` /
  `lint-assertion-mismatches.ts`.

Rename `test-compare/test-compare.ts` → `test-compare/compare.ts` (update
run.sh/orchestrate.ts, the one `.github/workflows` path reference, and the
changed-files regex). Keep `assertion-ratchet.ts` only if it is a library
consumed by `lint-assertion-mismatches.ts`; entry points must follow
`lint-*`. Add a README (per compare dir or one in `scripts/parity-tools/`)
documenting which files are baselines/marks/excludes and that all are
only-shrink. Do NOT move baseline files: they are referenced by path from CI
and lint tooling (serializeBaseline and sharded-mark traps).

## Acceptance criteria

- All four compare dirs use `compare.ts` as the main entry; CI green.
- Lint entry points follow `lint-<subject>.ts`.
- Baseline layout README exists; no baseline file moved.
- `pnpm parity:test` output delta exactly zero.
