---
title: "Wide call-mismatch ratchet red on main with 7 new entries"
status: draft
updated: 2026-07-28
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The wide call-mismatch ratchet is failing on `origin/main` independently of any
one PR. Reproduced locally at `bce9297fa` with a clean tree:

```text
pnpm api:compare --wide-calls
pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts
→ wide call-mismatches ratchet: 7 NEW wide mismatch(es) not in the baseline.

  + activerecord  connection-adapters/abstract/schema-statements.ts  table_exists?  include?
  + activerecord  connection-adapters/abstract/schema-statements.ts  table_exists?  tables
  + activerecord  migration.ts  migrate_without_lock  invalid_target?
  + activerecord  migration.ts  migrate_without_lock  new
  + activerecord  migration.ts  record_environment  down?
  + activerecord  scoping.ts  ignore_default_scope=  set_ignore_default_scope
  + activerecord  tasks/database-tasks.ts  migrate  write
```

The `table_exists?` pair arrived with #5486 (`fall back to tables.include? when
table_exists? hits NotImplementedError`) — that PR _added_ the `tables` /
`include?` calls to the TS body, which is a convergence, so those two are
likely stale-artifact entries needing the baseline reseeded rather than code
changes. The `migration.ts` / `scoping.ts` / `database-tasks.ts` five need
triage on their own: each is a ported TS body omitting a call Rails makes.

Because the ratchet is a repo-wide gate, every open PR now inherits this
failure regardless of its diff, which masks real regressions and trains
reviewers to ignore the job. Surfaced while rebasing #5485; explicitly not
fixed there since none of the seven are in that PR's diff.

Per `feedback_ci_failures_rfc_always_top_priority` this is P1.

## Acceptance criteria

- [ ] Each of the seven entries is triaged into either (a) implement the
      missing call, or (b) baseline it with a one-line reason in the
      per-source file under `scripts/api-compare/call-mismatches-wide-exclude/`.
- [ ] For the two `table_exists?` entries specifically, confirm whether #5486
      already satisfies the call and the artifact simply needs regenerating —
      do not baseline a call the TS body actually makes.
- [ ] `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` exits 0
      on a clean `main`.
- [ ] No converged entry is left in the baseline (the ratchet only shrinks, so
      a stale entry fails CI just as a new one does).
