---
title: "activerecord nested seats and untyped seats become plain assignments"
status: draft
updated: 2026-11-11
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9979 converted `ActiveRecord.DestroyAssociationAsyncJob` to a plain seat. It had to revert `FixtureSet` (`fixtures.ts:450`), `Result` (`result.ts:295`) and `Relation` (`relation.ts:1820`) to `constSet`. Each of those parents is followed by a nested `constSet` (`FixtureSet::File`, `Result::IndexedRow`, `Relation::WhereClause` / `QueryAttribute`). That nested call derives its path from the parent's seated classpath (`ruby-compat/lib/include.ts` `constSet`, `parentalPath`). A plain parent assignment writes none at module eval, so `pnpm parity:class-paths:check` reported `seated Relation::WhereClause, generated ActiveRecord::Relation::WhereClause`.

Rails defines these classes nested in their owners (`activerecord/lib/active_record/relation/where_clause.rb`, `result.rb`, `fixture_set/file.rb`), and none of those bodies calls `const_set`.

The same constraint holds `Validations` (`validations.ts:51`, a plain object whose validator seats nest under it). A second set stays on `constSet` only because `ActiveRecord` has no declared property for them: `PredicateBuilder` (`relation/predicate-builder.ts:261`), `TableMetadata`, `FixtureClassNotFound`, `Deadlocked` and `AsynchronousQueryInsideTransactionError` (`errors.ts:654-659`).

## Acceptance criteria

- [ ] Nested seats become plain `Owner.Name = Klass` assignments too, with static or namespace declarations added. Each name then comes from `constants*.generated.ts`, and parent and child seats are both plain.
- [ ] The untyped seats gain `ActiveRecord` namespace declarations and become plain assignments.
- [ ] `pnpm parity:class-paths:check` stays clean.
