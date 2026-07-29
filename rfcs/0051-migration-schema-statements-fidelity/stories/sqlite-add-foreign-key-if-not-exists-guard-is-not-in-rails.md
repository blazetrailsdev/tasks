---
title: "sqlite3: addForeignKey's ifNotExists guard has no counterpart in the Rails override"
status: claimed
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-29T22:24:04Z"
assignee: "sqlite-add-foreign-key-if-not-exists-guard-is-not-in-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite `add_foreign_key`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:56-63`)
is a full override with exactly two statements — `assert_valid_deferrable` then
the `alter_table` block. It carries **no** `if_not_exists` short-circuit and no
`use_foreign_keys?` guard; both live only on the abstract implementation
(`abstract/schema_statements.rb:1173-1182`), which the override replaces
outright. So in Rails, `add_foreign_key(..., if_not_exists: true)` on SQLite
does not short-circuit — it falls through to the rebuild.

trails' override
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2186-2200`)
opens with an `options.ifNotExists === true` guard calling `foreignKeyExists`
that has no counterpart in the Rails override. Surfaced while porting the
prefix-strip fix in PR #5606; left in place there because removing it is a
behavior change outside that story's scope.

Decide whether the guard is a needed trails accommodation (if so, justify it at
the call site per the deviation convention) or an invention to delete. If it is
deleted, check whether any caller depends on the short-circuit — the extra
`foreignKeyExists` reflection query it issues is observable in query-count
assertions.

## Acceptance criteria

- [ ] SQLite `addForeignKey` either drops the `ifNotExists` guard to match
      schema_statements.rb:56-63, or keeps it with a call-site justification
      naming the Rails line it deviates from.
- [ ] `migration/foreign-key.test.ts` and
      `migration/references-foreign-key.test.ts` stay green on all three
      adapters.
- [ ] If the guard is removed, a test covers `addForeignKey` with
      `ifNotExists: true` on SQLite so the chosen behavior is pinned.
