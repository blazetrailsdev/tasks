---
title: "Opt packages/pg into DB_ADAPTER_RE so draft PRs run its PG-lane step"
status: done
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: trails#10492
claim: "2026-11-21T13:17:35Z"
assignee: "enroll-pg-in-rails-private-jsdoc"
blocked-by: null
closed-reason: null
---

## Context

`.github/workflows/ci.yml:127` `DB_ADAPTER_RE` is the draft opt-in for `postgres-tests` / `maria-tests`. trails#10477 added `packages/mysql2/` to it, but `packages/pg/` is still missing. So a draft PR that touches only `packages/pg` sets `ar_scope` but skips `postgres-tests`, and the `pnpm vitest run packages/pg` step (added in trails#10317) never runs. `scripts/ci-suite-coverage.test.ts`'s "fires db_adapter_affected for PG/MySQL adapter paths" case pins `packages/mysql2/lib/error.ts`; no `packages/pg` path is in its `runs` list.

## Acceptance criteria

- [ ] `DB_ADAPTER_RE` includes `packages/pg/`.
- [ ] The `db_adapter_affected` case in `ci-suite-coverage.test.ts` lists a `packages/pg/lib/*.ts` path under `runs`, and the test fails without the regex change.
