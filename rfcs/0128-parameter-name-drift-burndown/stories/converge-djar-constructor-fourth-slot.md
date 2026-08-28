---
title: "DisableJoinsAssociationRelation's constructor carries a fourth slot Rails has no counterpart for"
status: draft
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' relation takes three parameters and stores two fields:

```ruby
# vendor/rails/activerecord/lib/active_record/disable_joins_association_relation.rb:5
attr_reader :ids, :key

def initialize(klass, key, ids)
  @ids = ids.uniq
  @key = key
  super(klass)
end
```

PR #7171 made the two public overloads of
`packages/activerecord/src/disable-joins-association-relation.ts` carry exactly
that shape, which cleared the three reported parameter rows. What it did not
remove is the **fourth constructor slot** underneath them, which Rails has no
counterpart for and which carries two unrelated payloads:

- a `chainWalker` (`() => Promise<{ relation }>`) for "deferred-chain mode",
  where `DisableJoinsAssociationScope#scope` returns a Relation synchronously and
  the async chain walk happens at `toArray()` time
  (`associations/disable-joins-association-scope.ts:55`, via the `deferred` static);
- a `TrustedClonePayload<T>` gated by the module-private `TRUSTED_CLONE` symbol,
  the fast path `clone` uses to adopt already-normalized state.

Rails needs neither: `DisableJoinsAssociationScope#scope`
(`vendor/rails/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:8-19`)
walks the chain synchronously because every `pluck` in it is synchronous, so the
relation it constructs is always the loaded-chain form. The deferred mode is the
port's answer to those `pluck`s being async — a genuine language gap, but the
`deferred` static and the fourth slot are trails-only surface either way.

## Converged shape

One constructor matching `initialize(klass, key, ids)`, with the deferred walk
and the clone fast path expressed without a fourth positional parameter — the
walker held as instance state assigned after construction by `deferred`, and the
clone path via a private method rather than a symbol-keyed constructor payload.
If the deferred mode genuinely cannot lose the slot, the remaining deviation
needs a `@noRailsEquivalent` receipt naming the async-`pluck` shortcoming, not a
silent extra parameter.

## Acceptance criteria

- `DisableJoinsAssociationRelation`'s constructor takes Rails' three parameters,
  or the surviving deviation carries a receipt at the call site.
- `deferred` / `clone` keep working; the `TRUSTED_CLONE` symbol is gone or no
  longer rides a constructor argument.
- `pnpm parity:api:params`, `parity:api:extra --package activerecord` and the
  `disable-joins-*` tests are green on all three lanes.
