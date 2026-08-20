---
title: "joinConstraints reads whereClause.ast instead of Rails' arel.constraints.first"
status: claimed
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-08-20T10:52:33Z"
assignee: "delegate-select-bang-to-scope"
blocked-by: null
closed-reason: null
---

## Context

`JoinAssociation#join_constraints`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:56-58`)
materializes the association scope through Arel ONCE per chain step and reads
the join predicates off that result:

```ruby
arel = scope.arel(alias_tracker.aliases)
nodes = arel.constraints.first
```

trails' `packages/activerecord/src/associations/join-dependency/join-association.ts`
does neither. It reads `scope.whereClause.ast` directly, with a hand-built
key-equality fallback for the empty-where case:

```ts
let nodes: Nodes.Node;
if (scope && scope.whereClause && !scope.whereClause.isEmpty()) {
  nodes = scope.whereClause.ast;
} else {
  // ~15 lines rebuilding joinPrimaryKey/joinForeignKey equality by hand
}
```

and only calls `scope.arel(aliasTracker)` later, inside the
`others.length > 0` branch, to fetch `joinSources()`. Two consequences:

1. The fallback branch is invented surface with no Rails counterpart — Rails
   never rebuilds key equality here because `join_scope` always produces the
   predicate and `arel.constraints.first` always returns it.
2. `arel` is built zero or one times depending on `others`, where Rails builds
   it exactly once, unconditionally, before the `Arel::Nodes::And` extraction.
   Any scope state that only materializes through `Relation#arel` (ORDER, the
   nested join dependency this story's sibling just added) is therefore visible
   to trails only on the `others` path.

`Relation#arel` exists in trails (`relation/query-methods.ts:2125`), so the
pieces are in place.

## Converged shape

- Replace the `whereClause.ast` read and its hand-built else-branch with the
  Rails two lines: `const arel = scope.arel(aliasTracker); let nodes =
arel.constraints[0];`, built unconditionally, before the `Nodes.And`
  extraction.
- Delete the invented `joinPrimaryKey`/`joinForeignKey` fallback and its
  bespoke `Error` (`joinConstraints: joinPrimaryKey and joinForeignKey must
have the same number of columns ...`), which has no Rails raise site.
- Reuse that same `arel` for `arel.joinSources()` in the `others` branch rather
  than calling `scope.arel(...)` a second time — Rails' single local.

## Acceptance criteria

- [ ] `joinConstraints` reads its predicates from `scope.arel(aliasTracker)
.constraints[0]`, built once, mirroring join_association.rb:56-58.
- [ ] The hand-built key-equality fallback and its bespoke Error are gone.
- [ ] `pnpm parity:api:extra --package activerecord` novel count for
      `associations/join-dependency/join-association.ts` does not rise.
- [ ] Alias, eager, join-model, nested-through and preloader suites green on
      SQLite, PostgreSQL and MariaDB.
