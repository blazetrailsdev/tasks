---
title: "collection-proxy-retire-own-seeded-relation-state"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6610
claim: "2026-08-16T22:33:32Z"
assignee: "collection-proxy-retire-own-seeded-relation-state"
blocked-by: null
closed-reason: null
---

## Context

PR #6612 delegated the QueryMethods value accessors on `CollectionProxy` to
`scope()` the way Rails does (`collection_proxy.rb:1128-1137`), so every read
of `where_clause` / `order_values` / `limit_value` / … on the proxy now
resolves through `@association.scope`.

That leaves the proxy's OWN inherited relation state — seeded in the
constructor in `packages/activerecord/src/associations/collection-proxy.ts`
(`seedNone()` for the unresolvable-FK / new-owner case, `initializeCopy(seedRel)`
otherwise) — read by nothing except the trails-only new-owner rebase
machinery:

- `_seedWherePredicates` (`relation.ts`)
- `_seededNoneNewOwner` (`relation.ts`)
- `CollectionProxy#_maybeRebaseProxySeed` / `#_isEmptyRelation`
- `associations/new-owner-seed-rebase.ts`

A Rails `CollectionProxy` owns no relation state at all: `initialize` is
`@association = association; super klass` (`collection_proxy.rb:32-38`), and
the stale-new-owner problem does not exist there because `reader` runs
`@proxy.reset_scope` on every collection read
(`collection_association.rb:42`) and the owner's save runs
`association.reset_scope` (`autosave_association.rb:428`).

trails' `CollectionProxy#scope()` already skips the memo entirely while the
owner is a new record, so a post-save read builds a fresh, resolved scope —
which is plausibly the whole of what the rebase machinery was compensating
for, now that the readers delegate.

## Acceptance criteria

- Establish whether the rebase machinery is still reachable at all once the
  readers delegate; if it is not, delete the constructor seeding,
  `_seedWherePredicates`, `_seededNoneNewOwner`,
  `_maybeRebaseProxySeed`, the `_isEmptyRelation` override, and
  `associations/new-owner-seed-rebase.ts`.
- If some behaviour genuinely still depends on it, converge on Rails'
  `reset_scope` seams (`collection_association.rb:42`,
  `autosave_association.rb:428`) rather than keeping the seed snapshot.
- `CollectionProxy — mutation terminals invoked on the proxy itself on stale
new-owner seed` stays green on SQLite, PostgreSQL and MySQL/MariaDB.
- `pnpm parity:api:extra` shrinks (these are all trails-only names);
  `parity:api` / `parity:test` deltas non-negative.
