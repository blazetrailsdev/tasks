---
title: "Invoke check_all_foreign_keys_valid! after fixture insert when verify_foreign_keys_for_fixtures is on"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6177
claim: "2026-08-07T15:38:12Z"
assignee: "datetime-sf-is-a-number-not-a-rational"
blocked-by: null
closed-reason: null
---

## Context

**Re-homed 2026-08-07** from `0014-fixtures-adoption`, which is `superseded` — its successor `0019-canonical-schema-burndown` is itself now `closed` with no open stories, so this story had no reachable parent and the non-active-parent rule (`scripts/validate-lib.mjs:44`) kept it out of the ready queue permanently. Premise re-verified against `origin/main` (311bff350) at the time of the move; the work below is live, not rot.

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
