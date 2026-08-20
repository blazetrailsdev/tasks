---
title: "ensure_mutable belongs on HasManyThroughAssociation, not as a proxy-side guard"
status: done
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6755
claim: "2026-08-20T01:22:34Z"
assignee: "collection-proxy-delegate-leftjoins-without-fix"
blocked-by: null
closed-reason: null
---

## Context

The second half of the proxy's through subsystem (see the sibling story that
moves `_throughOwnerCols` & co.), **35 code lines** plus the predicate pair:

- `_ensureThroughWritable` (`packages/activerecord/src/associations/collection-proxy.ts:940`,
  29 lines) — a readonly/nested-through mutation guard the proxy runs before
  `clear` and the delete paths. Rails' equivalent is
  `HasManyThroughAssociation#ensure_mutable` /
  `#ensure_not_nested`
  (`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb`),
  which the _association_ runs from `insert_record` / `delete_records` — never
  the proxy.
- `_throughAssociation` (`:1414`, 3) — a cast helper reaching for the
  association's through handle.
- `isThrough` (`:342`) / `_isThrough` (`:892`) — a public and a private copy of
  the same `!!options.through` predicate. Rails asks the reflection
  (`reflection.through_reflection?`), and trails' reflection already answers it.

`packages/activerecord/src/associations/has-many-through-association.ts` and
`.../through-association.ts` are the destinations and already exist. The open
story `0112-one-rails-thing-n-trails-things/consolidate-duplicated-through-association-module`
consolidates the ThroughAssociation mixin itself — this story feeds it and
should land after or independently, never re-splitting it.

## Converged shape

`ensure_mutable`'s guard runs where Rails runs it — inside the through
association's `insert_record` / `delete_records` — so the proxy's mutation
bodies carry no guard call. `_throughAssociation` disappears with its callers.
`isThrough`/`_isThrough` collapse onto the reflection predicate; keep at most
the one spelling a Rails caller needs.

## Acceptance criteria

- `_ensureThroughWritable`, `_throughAssociation` and `_isThrough` no longer
  exist in `collection-proxy.ts`; `isThrough` survives only if a caller outside
  the file needs it, and then reads the reflection.
- The mutability guard is enforced from the through association's own
  `insertRecord` / `deleteRecords`, with the Rails name and a
  `has_many_through_association.rb` citation.
- A regression test proves the guard still fires on the nested-through and
  readonly arms **and fails on the pre-change baseline of the moved code**.
- `pnpm parity:api:calls` / `:args` add zero rows for any touched file.
- Existing suites pass unchanged, incl.
  `has-many-through-associations.test.ts`,
  `nested-through-advanced.test.ts`. No test renamed.
