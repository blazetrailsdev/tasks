---
title: "Retire describeIfMysql (server-reachability probe) once the burn-down drains its callers"
status: draft
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: ["mysql-tests-self-built-adapter-burndown-batch-3"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Discovered while shipping #5306 (`mysql-tests-self-built-adapter-burndown`).
`adapters/abstract-mysql-adapter/test-helper.ts:62-68` exports `describeIfMysql`
— a _server-reachability_ probe built on a module-load `SELECT VERSION()`
(`checkMysql()`, same file). It is not the port of anything in Rails: Rails
gates these suites with `current_adapter?(:Mysql2Adapter)`
(`vendor/rails/activerecord/test/support/adapter_helper.rb:4-9`), which #5306
ported as `describeIfMysqlAdapter`.

Two problems with keeping the probe once the burn-down finishes:

1. A suite gated on it **silently skips its whole file** when the server is
   unreachable on the MySQL lane, where that should be a loud failure.
2. `MYSQL_TEST_URL` (same file) exists only to feed self-built adapters and the
   probe, so it cannot go away while the probe has callers.

Blocked on `mysql-tests-self-built-adapter-burndown-batch-2` and `-batch-3`
draining the remaining `describeIfMysql` call sites (~19 files at the time of
writing).

## Acceptance criteria

- [ ] `describeIfMysql` deleted from `test-helper.ts`, along with `checkMysql`'s
      `available` plumbing if nothing else consumes it (`isMariaDb`,
      `mysqlVersion`, `supportsOptimizerHints`, `supportsDefaultExpression`,
      `supportsExpressionIndex` all read the same probe — keep what they need).
- [ ] `MYSQL_TEST_URL` deleted, or its doc comment narrowed to the surviving
      second-adapter callers only.
- [ ] `describeIfMysql` removed from `ADAPTER_SUITE_WRAPPERS`
      (`scripts/test-compare/extract-ts-core.ts:287-293`) and `gateFromWrapper`
      (`scripts/test-compare/gates.ts:75-91`).
- [ ] CI green on all three adapters; `pnpm test:compare` gate-mismatch stays 0.
