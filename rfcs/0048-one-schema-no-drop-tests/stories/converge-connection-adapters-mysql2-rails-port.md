---
title: "converge-connection-adapters-mysql2-rails-port"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T17:32:32Z"
assignee: "converge-connection-adapters-mysql2-rails-port"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/mysql2-adapter.test.ts` (1075
lines) has NO 1:1 Rails counterpart
(`vendor/rails/activerecord/test/cases/connection_adapters/mysql2_adapter_test.rb`
does not exist). Per the RFC 0048 convergence contract, a trails file with no
Rails source is bespoke: delete it and port the real Rails test cases that
cover this behavior (likely split across the existing
`adapters/mysql2/mysql2_adapter_test.rb` and the abstract_mysql_adapter suite).
Confirm the right Rails homes before deleting.

Split from converge-mysql-adapter-ddl-one-schema.

## Acceptance criteria

- [ ] Confirm no 1:1 Rails source; map each behavior to its real Rails test.
- [ ] Delete the bespoke suite; ported cases mirror Rails names/assertions.
- [ ] Ride canonical TEST_SCHEMA + official models/fixtures only.
- [ ] Fix impl or file 0023-surfaced-deviations for any surfaced gaps.
- [ ] Split by file under 500 LOC; all-or-nothing.
