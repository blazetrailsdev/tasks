---
title: "Inline AbstractMysqlAdapter#_execMutation into direct execute calls"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
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

`AbstractMysqlAdapter` reaches its SQL primitive through a trails-only
indirection, `_execMutation`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:759-773`),
called from ~12 DDL sites (lines 634-1179). It does a runtime `typeof` check and
throws "must implement execute() to use DDL helpers" if absent.

Rails has no counterpart: `AbstractMysqlAdapter` just calls `execute` directly
(e.g. `change_column_default` is
`execute "ALTER TABLE #{quote_table_name(table_name)} #{change_column_default_for_alter(...)}"`,
`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`).

PR #4962 retargeted the helper from `executeMutation` to `execute`, which makes
the indirection redundant: `execute` is declared on the `AbstractAdapter`
interface that every concrete adapter satisfies, so the defensive `typeof` guard
can no longer fire and the wrapper only obscures the Rails call shape from
api:compare.

## Acceptance criteria

- [ ] Replace the `_execMutation(sql)` call sites with `this.execute(sql)`,
      matching Rails' direct `execute` calls.
- [ ] Delete `_execMutation` and its runtime `typeof` guard.
- [ ] Confirm api:compare still maps these methods (the calls should now match
      Rails' `execute` call set — this may converge wide-ratchet entries, which
      must then be removed from the baseline by hand, not via `--write`).
- [ ] MySQL/MariaDB DDL suites stay green under the `ARCONN` CI job.
