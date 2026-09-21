---
title: "assertions-tail-adapters-1-remainder-2-mysql-lane-assertions"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7940
claim: "2026-09-21T21:25:01Z"
assignee: "assertions-tail-adapters-1-remainder-2-mysql-lane-assertions"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-tail-adapters-1-remainder-2` (MySQL lane). Remaining mismatches:
`adapters/mysql2/mysql2_adapter_test.rb` (8 count / 14 kind) and
`adapters/abstract_mysql_adapter/connection_test.rb` (6 count / 10 kind). Mostly
`toBeInstanceOf`/`toThrow` where Rails uses `assert_raises`, and `toBe` where Rails uses
`assert`/`assert_not` — see `pnpm parity:test -- --package activerecord --assertions --missing`.
`assert_changes` in `database timezone changes synced to connection` maps to `assertChanges`.

## Acceptance criteria

- Both files report 0 count/kind/value mismatches.
- Converged bodies verified on a MySQL lane (ARCONN=mysql2) or CI.
