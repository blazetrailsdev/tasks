---
title: "Extract shared E2E scaffold/teardown helpers"
status: ready
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

Post-merge finding from the ar-cli series (#2752). The three E2E suites
(`sqlite-happy-path`, `postgres-happy-path`, `mysql-happy-path`) each inline the
same tmp-dir scaffold + `DatabaseTasks` teardown block. Extract into
`src/__e2e__/helpers.ts`. No behavior change.

## Acceptance criteria

- [ ] Shared tmp-dir scaffold + teardown extracted to
      `packages/activerecord-cli/src/__e2e__/helpers.ts`.
- [ ] All three E2E suites use the helper; no behavior change.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
