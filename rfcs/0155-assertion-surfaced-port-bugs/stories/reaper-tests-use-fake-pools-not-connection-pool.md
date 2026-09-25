---
title: "reaper_test: use real ConnectionPool like Rails"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8078
claim: "2026-09-25T03:11:52Z"
assignee: "assertions-mysql-legacy-migration-engine-innodb-option"
blocked-by: null
closed-reason: null
---

## Context

trails#7889 converged reaper_test.rb assertions using fake pools. Rails (vendor/rails/activerecord/test/cases/reaper_test.rb:66-129) builds real `ConnectionPool`s (`duplicated_pool_config`, `new_conn_in_thread`, `wait_for_conn_idle`) and asserts `conn.in_use?` before/after the reaper reaps a leaked connection, plus `pool.reaper` presence (:57-64) and `pool.discard!` then `pool.reap; pool.flush` (:105-114). packages/activerecord/src/reaper.test.ts tests `Reaper` against a fake `{reap, flush, isDiscarded, inUse}` object instead.

## Acceptance criteria

- The tests "pool has reaper", "connection pool starts reaper", "reaper works after pool discard", "reap flush on discarded pool" use `ConnectionPool` from `duplicated_pool_config` with `reapingFrequency`, and a connection checked out from a separate async context, mirroring Rails.
- Assertion parity stays at 0 for reaper_test.rb.
