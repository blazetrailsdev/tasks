---
title: "mysql2 multi-statement ERR surfaces at next_result, earlier sets kept"
status: in-progress
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10640
claim: "2026-11-23T13:32:34Z"
assignee: "mysql2-local-infile-ports-infile-c"
blocked-by: null
closed-reason: null
---

## Context

`client.test.ts` "Multiple results sets > should raise an exception when one of multiple statements fails" stays skipped (trails#10616). In libmysql, the first result set comes back and `next_result` raises at the failing statement (`rb_mysql_client_next_result`, `vendor/mysql2/0.5.6/ext/mysql2/client.c`; spec `client_spec.rb:783-790`). trails' `_query` awaits npm's promise `query`, which rejects the whole multi-statement query on the ERR packet and drops the sets read before it.

## Converged shape

Run non-streamed queries through the core `Query` command's per-result events (`fields`/`result` with a result index, `error`, `end`). Collect each set in order and queue the ERR as the next pending result. `nextResult()` raises it via `raiseMysql2Error`, then returns false.

## Acceptance criteria

- [ ] The skipped spec runs and passes.

- [ ] The other six "Multiple results sets" specs and the AR mysql2 adapter suite still pass.
