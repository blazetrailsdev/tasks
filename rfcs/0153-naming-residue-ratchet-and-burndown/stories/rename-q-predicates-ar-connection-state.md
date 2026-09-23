---
title: "Rename the AR connection-state Q predicates to isConnected / isConnectedTo / isActiveConnections"
status: in-progress
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: 30
pr: trails#8011
claim: "2026-09-23T19:08:40Z"
assignee: "naming-residue-burndown-activerecord-relation"
blocked-by: null
closed-reason: null
---

## Context

The `Q` predicate spelling (`connected?` → `connectedQ`) is rejected: predicates
port as `isX` (or the bare camel / the quoted literal `"x?"` where a sibling
collides), never `xQ`. The drop-q-predicate-suffix PR removed the `Q` candidate
from `rubyMethodToTs` (`scripts/parity/conventions.ts`), so these members no
longer pair with their Rails methods.

`has*` is a candidate only for a bare predicate that Rails itself aliases to a
`has_*?` method (trails#7981's `HAS_PREDICATE_ALIASES`: `key?` → `hasKey`,
`value?` → `hasValue`). Everything else takes the `is*` / camel / literal
target in the tables below.

`connectedQ` → `isConnected` already landed in trails#7981, so this story is left with `connectedToQ` and `activeConnectionsQ`.

This slice is the ActiveRecord connection-state predicates:

| trails (declaration)                                                                 | Rails                                                                    | target                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------- |
| `connectedQ` — `packages/activerecord/src/connection-handling.ts:319`, export `:610` | `connected?` — `connection_handling.rb:351`                              | `isConnected`         |
| `connectedToQ` — `connection-handling.ts:229`, export `:599`                         | `connected_to?(role:, shard:)` — `connection_handling.rb:253`            | `isConnectedTo`       |
| `activeConnectionsQ` — `connection-adapters/abstract/connection-handler.ts:195`      | `active_connections?(role = nil)` — `abstract/connection_handler.rb:157` | `isActiveConnections` |

`connectedTo` (the block method) already owns the bare camel name on the same
object, so `isConnectedTo` is the only valid spelling for `connected_to?`.

Re-exports / call sites to sweep:

- `base.ts:933` `declare static connectedToQ`, `base.ts:952` `declare static connectedQ`,
  `base.ts:2541` (`this.connectedQ()`).
- `connection-handling.ts:104,405,408`, `query-cache.ts:58,83` (Rails
  `query_cache.rb` `cache` / `uncached` call `connected?`),
  `model-schema.ts:25,720`, `support/adapter-helper.ts:22`.
- Tests: `connection-handlers-sharding-db.test.ts` (17), `connection-handlers-multi-db.test.ts` (13),
  `connection-management.test.ts` (6), `connection-handler.test.ts` (5),
  `query-cache.test.ts` (5), `base.test.ts` (4), `connection-handling.test.ts` (4),
  `active-record.test.ts` (3), `database-selector.test.ts`, `shard-selector.test.ts`,
  `support/handler-resolved-adapter.trails.test.ts`.
- `scripts/api-compare/extra-surface.test.ts:916` uses `connectedToQ` as a
  fixture; leave it for `retire-q-suffix-crediting-in-extra-surface-and-naming`.

Prior art: `rename-is-connected-q-onto-the-rails-connected-name` (0023, draft)
covers the `connected?` rename under the old `isConnectedQ` name. It is
superseded by this story; close it as a duplicate when this lands.

## Acceptance criteria

- `connectedToQ` and `activeConnectionsQ` no longer exist anywhere
  in `packages/*/src` (source or tests). Each is renamed to its target above,
  including the `declare static` re-exports on `Base`.
- `pnpm parity:api` activerecord coverage does not drop and gets back the
  `connected?` / `active_connections?` pairs (`base.rb`,
  `abstract/connection_handler.rb`).
- `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` are green.
