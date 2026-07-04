---
title: "Invoke check_all_foreign_keys_valid! after fixture insert when verify_foreign_keys_for_fixtures is on"
status: ready
updated: 2026-07-04
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

Rails' `fixtures.rb` `insert` calls `check_all_foreign_keys_valid!(conn)` once
per pool right after `conn.insert_fixtures_set(...)` (fixtures.rb:686), gated on
`ActiveRecord.verify_foreign_keys_for_fixtures`. trails' fixture load path
(`insertPreparedFixtureSets` in test-helpers/define-fixtures.ts, PR #4545) never
invokes it, even though the adapter method exists
(`checkAllForeignKeysValidBang`, converged in story
check-all-foreign-keys-valid-converge-requires-new-transaction) and the config
flag exists (`verify_foreign_keys_for_fixtures`, ar-config.ts:270, default
false).

This is a latent Rails deviation: when the flag is flipped on, trails would NOT
validate FKs after a fixture load, silently diverging from Rails' behavior of
raising on a dangling fixture FK. Surfaced during the single-insert merge port;
pre-existing, not a regression.

## Acceptance criteria

- After the single merged `insertFixturesSet`, `insertPreparedFixtureSets` calls
  `adapter.checkAllForeignKeysValidBang()` once when
  `verify_foreign_keys_for_fixtures` is true (mirroring fixtures.rb:686 —
  once per load, after the insert, not per set).
- Default (flag false) behavior unchanged — no extra query on the hot path.
- A test flips the flag on and asserts a dangling-FK fixture load raises.
