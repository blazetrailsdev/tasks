---
title: "Base ToSql IsDistinctFrom emits native syntax instead of Rails' CASE form"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 28
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while sweeping unrouted arel privates in PR #5025 (story
`arel-unrouted-privates-drop-carried-arguments`). That PR judged the remaining
unrouted privates low-value because they carry no droppable arguments; that is
true of their _signatures_, but routing them changes the SQL emitted, so the
finding was under-called and is filed here.

`packages/arel/src/visitors/to-sql.ts` defines `isDistinctFrom(o, collector)`
(the CASE-form fallback) but nothing calls it. The base visitors emit native
syntax instead:

```ts
visitArelNodesIsDistinctFrom(node, collector); // -> "IS DISTINCT FROM"
visitArelNodesIsNotDistinctFrom(node, collector); // -> "IS NOT DISTINCT FROM"
```

Rails' base `to_sql.rb:658-676` does NOT emit native syntax — it emits the
CASE form and compares:

```ruby
def visit_Arel_Nodes_IsDistinctFrom(o, collector)
  if o.right.nil?
    collector = visit o.left, collector
    collector << " IS NOT NULL"
  else
    collector = is_distinct_from(o, collector)
    collector << " = 1"
  end
end
```

Native `IS [NOT] DISTINCT FROM` is the _PostgreSQL/SQLite override_
(`postgresql.rb`, `sqlite.rb`), not base behavior. Trails has promoted an
adapter override into the base visitor, so any adapter without native support
gets SQL it cannot run. MySQL overrides differently again
(`mysql.rb` maps IsDistinctFrom to `NOT <=>`), which is the arm the wide
baseline flags.

## Acceptance criteria

- Base `ToSql` visitors for `IsDistinctFrom` / `IsNotDistinctFrom` route
  through `isDistinctFrom` and append `" = 1"` / `" = 0"`, matching
  to_sql.rb:658-676, including the `o.right.nil?` early arms.
- Native syntax moves to (or stays in) the PostgreSQL and SQLite visitors
  per their Rails counterparts; MySQL's `<=>` arm verified against mysql.rb.
- Tests assert the emitted SQL per visitor, not just the node class — the
  failure mode this class of bug hides behind.
- Remove any wide-baseline entries that converge. Re-run
  `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before `pnpm api:calls:wide`.
