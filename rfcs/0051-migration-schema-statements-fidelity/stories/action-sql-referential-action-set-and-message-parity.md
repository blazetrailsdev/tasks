---
title: "actionSql accepts non-Rails referential actions and diverges on the ArgumentError text"
status: claimed
updated: 2026-07-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-27T15:27:35Z"
assignee: "action-sql-referential-action-set-and-message-parity"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `foreign_key_test.rb:302`
(`test_on_update_and_on_delete_raises_with_invalid_values`) in PR #5307.

`SchemaCreation#actionSql`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:611`)
accepts five referential actions — `cascade`, `nullify`, `restrict`,
`no_action`, `set_default` — and its `ReferentialAction` union
(`abstract/schema-definitions.ts:64`) enumerates all five.

Rails' `action_sql` (`schema_creation.rb:175-186`) supports exactly three:

```ruby
when :nullify then "ON #{action} SET NULL"
when :cascade  then "ON #{action} CASCADE"
when :restrict then "ON #{action} RESTRICT"
else
  raise ArgumentError, <<~MSG
    '#{dependency}' is not supported for :on_update or :on_delete.
    Supported values are: :nullify, :cascade, :restrict
  MSG
```

Two deviations:

1. `no_action` / `set_default` are trails inventions with no Rails counterpart.
2. The `ArgumentError` message text differs — ours reads
   `'x' is not supported for on_update or on_delete. Supported values are:
cascade, nullify, restrict, no_action, set_default` vs Rails' symbol-styled
   `:on_update or :on_delete` / `:nullify, :cascade, :restrict`.

PR #5307 fixed only the _error class_ (was a plain `Error`, now `ArgumentError`)
because that is what the ported test asserts; it deliberately left the extra
values and the message text alone as out of scope.

Note the SQLite mirror in `sqlite3-adapter.ts`'s `REFERENTIAL_ACTION_MAP` /
`normalizeReferentialAction` carries the same five values and the same message —
both sides must move together. See also
`sqlite-alter-table-hand-rolls-fk-sql-instead-of-schema-creation`.

## Acceptance criteria

- [ ] Decide (and record at the call site) whether `no_action` / `set_default`
      are dropped or kept as a justified deviation; if dropped, remove them from
      `ReferentialAction`, `actionSql`, and `REFERENTIAL_ACTION_MAP`.
- [ ] `actionSql`'s `ArgumentError` message matches `schema_creation.rb:181-184`
      verbatim (including the `:symbol` styling), or the divergence is justified
      in a comment at the raise site.
- [ ] `packages/activerecord/src/migration/foreign-key.test.ts`'s
      `on update and on delete raises with invalid values` still passes on all
      three adapters.
