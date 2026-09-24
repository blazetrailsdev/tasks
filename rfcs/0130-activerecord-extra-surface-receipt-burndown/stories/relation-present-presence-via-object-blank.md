---
title: "relation-present-presence-via-object-blank"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: trails#8040
claim: "2026-09-24T16:13:07Z"
assignee: "converge-invented-association-scope-and-key-helpers"
blocked-by: null
closed-reason: null
---

## Context

Split out of `relocate-core-ext-shaped-permanent-receipts`. `Relation#isPresent` /
`Relation#presence` (`packages/activerecord/src/relation.ts`, next to `isBlank`) score
`moved`: Rails does not define `present?` / `presence` on `Relation`. They are
`Object#present?` (`!blank?`) and `Object#presence` (`self if present?`) from
`activesupport/lib/active_support/core_ext/object/blank.rb`, dispatching to
`Relation#blank?` (`activerecord/lib/active_record/relation.rb`, `records.blank?`).

It is not a plain deletion, for two reasons:

- activesupport's port, `isPresent(value)` / `presence(value)`
  (`packages/activesupport/src/core-ext/object/blank.ts`), deliberately skips an async
  `isBlank`, so `isPresent(Topic.all())` answers `true` for an empty relation.
  Trails' `Relation#isBlank` is async (it runs the query), so `present?` is async too.
- `presence` returns the relation itself. Returning a thenable `Relation` from an
  async body evaluates it, which is why the trails body wraps it in `stripThenable`
  (CLAUDE.md § "`Relation` is evaluated by an async query"). activesupport cannot
  see `stripThenable`.

Callers are tests only: `relations.test.ts` `presence` (Rails
`relations_test.rb` `test_presence`), `associations/join-model.test.ts`,
`relation.trails.test.ts`, `relation/thenable.trails.test.ts`.

## Acceptance criteria

- `Relation#isPresent` / `#presence` are removed from `relation.ts`. Callers reach
  `present?` / `presence` through activesupport's `blank.ts` port, which answers a
  receiver with an async `blank?` by awaiting it, the way Ruby's `!blank?` dispatches.
- The thenable problem for `presence` is solved without an activerecord-only member,
  or the `@noRailsEquivalent CONVERGEABLE` receipt names the specific language
  shortcoming, cited to CLAUDE.md.
- `pnpm parity:api:extra:gate` is green, with no new novel surface in activesupport.
