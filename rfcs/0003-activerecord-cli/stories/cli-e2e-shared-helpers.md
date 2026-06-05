---
title: "Extract shared E2E scaffold/teardown helpers"
status: ready
updated: 2026-06-04
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-package-scaffold"]
deps-rfc: []
est-loc: 50
priority: 21
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2752). Still live as of 2026-06-05 —
`src/__e2e__/` holds only the three suite files, no `helpers.ts`. Each suite
inlines the same `mkdtemp(join(tmpdir(), "ar-cli-e2e-"))` scaffold (e.g.
`sqlite-happy-path.test.ts:30`) and the same `DatabaseTasks` singleton-reset +
`rm(tmpDir, …)` teardown block (`sqlite-happy-path.test.ts:44-49`, duplicated in
`postgres-happy-path.test.ts` and `mysql-happy-path.test.ts`). Extract into
`src/__e2e__/helpers.ts`. No behavior change.

## Acceptance criteria

- [ ] Shared `mkdtemp` scaffold + `DatabaseTasks`-reset/`rm` teardown extracted
      to `packages/activerecord-cli/src/__e2e__/helpers.ts`.
- [ ] All three E2E suites (`sqlite-/postgres-/mysql-happy-path.test.ts`) use the
      helper; no behavior change.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
