---
title: "converge-node-tosql-to-table-engine-connection"
status: in-progress
updated: 2026-07-21
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps:
  - convert-remaining-arel-visitor-sites-to-explicit-connection
deps-rfc: []
est-loc: 200
priority: null
pr: 5036
claim: "2026-07-21T18:30:22Z"
assignee: "converge-node-tosql-to-table-engine-connection"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to #5032. Rails' `Node#to_sql` takes an engine and uses the
_connection's own_ visitor — there is no connection-less path and no visitor
registry:

```ruby
# arel/nodes/node.rb:148-153
def to_sql(engine = Table.engine)
  collector = Arel::Collectors::SQLString.new
  engine.with_connection do |connection|
    connection.visitor.accept(self, collector).value
  end
end
```

`TreeManager#to_sql` (`arel/tree_manager.rb:53`) does the same.

trails diverges twice:

1. `Arel::Table.engine` exists (`packages/arel/src/table.ts:31`, typed `unknown`,
   defaults `null`) but **is never assigned anywhere in the repo**. Rails sets it
   to `ActiveRecord::Base` (see `insert_all_test.rb:27`, `fixtures_test.rb:60`).
2. To compensate, trails invented a process-global visitor registry —
   `setToSqlVisitor` (`packages/arel/src/nodes/node.ts:129`) plus `_registry.ToSql`
   — used by the parity runner (`scripts/parity/query/node/dump.ts:164`) and
   `nodes/node.test.ts`. `Node#toSql()` (`nodes/node.ts:33-36`) constructs
   `new _registry.ToSql!()` with no connection, which is what reaches the default
   quoter.

The adapter side is already Rails-faithful: `AbstractAdapter#visitor`
(`connection-adapters/abstract-adapter.ts:1697`) returns a visitor built with the
connection (`:654-655`), exactly Rails' `abstract_adapter.rb:155`.

**Correction to #5032's PR body — read this before sizing the work.** That PR
claimed this phase "touches 666 `.toSql()` call sites (279 arel + 387
activerecord)" and is the largest phase of RFC 0007. That is wrong. Rails'
signature _defaults_ the engine — `to_sql(engine = Table.engine)` — so every
existing bare `.toSql()` keeps compiling and working unchanged once
`Table.engine` is assigned. 666 is the blast radius _if the engine were left
unset_, not an edit count. **No call sites need editing.**

The real work is small and centralised: assign `Table.engine`, rewrite two
methods, delete the invented registry, repoint the parity runner. Sequence after
`convert-remaining-arel-visitor-sites-to-explicit-connection` only because that
story removes the constructor defaults this one would otherwise still reach.

## Acceptance criteria

- [ ] activerecord assigns `Arel::Table.engine` (to the AR base class) at load,
      mirroring Rails.
- [ ] `Node#toSql()` / `TreeManager#toSql()` take an engine defaulting to
      `Table.engine` and resolve the visitor via the connection, per
      `arel/nodes/node.rb:148-153`.
- [ ] `setToSqlVisitor` and the `_registry.ToSql` slot are removed; the parity
      runner selects its dialect by establishing a SQLite connection instead.
- [ ] api:compare / test:compare delta non-negative.
