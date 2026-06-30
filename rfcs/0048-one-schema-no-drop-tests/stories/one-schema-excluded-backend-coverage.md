---
title: "Cover PG/MySQL adapter excluded files flag-off on their native backend"
status: blocked
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: ["0019-canonical-schema-burndown"]
est-loc: 60
priority: 14
pr: null
claim: "2026-06-30T14:50:39Z"
assignee: "one-schema-excluded-backend-coverage"
blocked-by: "Blocked on PR #4246 (AR_ONE_SCHEMA no-drop test mode) which is still OPEN/unmerged. This story modifies the ar-one-schema-excluded CI lane and eslint/one-schema-exclude.json, neither of which exists on main yet. Per CLAUDE.md no-stacked-PRs rule, cannot build until #4246 merges."
---

## Context

PR #4246 made `AR_ONE_SCHEMA=1` the default mode on the sqlite/postgres/maria AR
CI lanes, which skip every file in `eslint/one-schema-exclude.json`. To keep
those excluded files covered, `ci.yml` added `ar-one-schema-excluded`, a flag-off
lane that runs the exclude list — but with `ARCONN` unset it defaults to sqlite,
and `vitest.config.ts` ADAPTER_SPECIFIC_EXCLUDE drops the Postgres/MySQL
adapter-dir files (e.g. `adapters/postgresql/*.test.ts`,
`adapters/mysql2/*.test.ts`, `connection-adapters/{postgresql,mysql2}-adapter.test.ts`).
So those ~9 backend-specific excluded files currently run flag-off **nowhere**.

## Acceptance criteria

- The PG/MySQL adapter-infra files in `eslint/one-schema-exclude.json` run
  flag-off on their own backend (extra `ARCONN=postgresql` / `ARCONN=mysql2`
  invocation of the exclude list with the matching DB URL, or a per-backend
  split of the list).
- No excluded file is left without a flag-off run on at least its native backend.
- `ar-one-schema-excluded` (or its successors) stays in the `ci` aggregator needs
  - skip allow-list.
