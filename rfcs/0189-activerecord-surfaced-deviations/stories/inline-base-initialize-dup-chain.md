---
title: "Base#initializeDup inlines its module super chain instead of hopping through rbCallSuper"
status: draft
updated: 2026-11-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10062 inlined `init_internals` on `Base` (`packages/activerecord/lib/base.ts`, `Base#initInternals`, one `@inlinedFrom` per segment) under CLAUDE.md § "A module method's `super` is inlined the same way". `Base#initialize_dup` is the same shape and is still a chain of `rbCallSuper` hops, one per `record.dup`:

- `packages/activerecord/lib/core.ts` (`core.rb:550`), `inheritance.ts` (`inheritance.rb:343`), `locking/optimistic.ts` (`locking/optimistic.rb:72`), `timestamp.ts` (`timestamp.rb:50`), `associations.ts` (`associations.rb:69`): `Base` is the only includer of each.
- `packages/activemodel/lib/validations.ts` (`validations.rb:310`), `dirty.ts` (`dirty.rb:248`), `attributes.ts` (`attributes.rb:111`): open-set modules, which keep their own copy on `rbCallSuper` for non-record includers while `Base` inlines the body, as `Base#initInternals` does with `ActiveModel::Dirty`.
- `packages/activerecord/lib/aggregations.ts` (`aggregations.rb:6`) is included into the user's class by `composed_of` at run time and stays on `rbCallSuper`; its `super` reaches `Base#initializeDup`.

`pnpm parity:api:inlined` checks the tag order against Rails' ancestry. On trails#10062 it showed that a body trails ran (`ActiveModel::Validations#init_internals`) is not in Rails' chain for a record, so read the chain from the gate, not from trails' current include order (`converge-base-include-order-to-base-rb` tracks that order).

On the benchmark in trails#10062 the same change took `initInternals` from 1,067 ns to 347 ns a call.

## Acceptance criteria

- `Base#initializeDup` is a class method holding each Rails body at its `super` position, tagged `@inlinedFrom` in ancestor order; the five ActiveRecord modules no longer define `initializeDup`.
- `pnpm parity:api:inlined`, `parity:api:calls`, `:calls:args` and `:extra:gate` pass, with the extra-surface marks tightened.
- `record.dup` behaviour is unchanged except where the gate shows a body Rails does not reach; any such change is named in the PR and covered by a test.
- `Aggregations#initializeDup` still reaches `Base`'s chain, covered by a test.
