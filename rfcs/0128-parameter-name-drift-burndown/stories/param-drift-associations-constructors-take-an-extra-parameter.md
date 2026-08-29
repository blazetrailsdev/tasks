---
title: "param-drift-associations-constructors-take-an-extra-parameter"
status: ready
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-associations` cleared 15 of the 19 parameter-name rows
in `associations/**` by renaming. Four rows survive, over two constructor pairs,
and neither is a spelling: each is an EXTRA TypeScript constructor parameter that
Rails does not have. The extra param shifts the aligned form
(`scripts/api-compare/param-names.ts` `tsForms`, which strips a leading
receiver-named param such as `record`), so one structural divergence is reported
as two renames. Renaming would make the names lie, so they were left alone.

### 1. `associations/collection_proxy.rb#initialize`

```text
associations/collection-proxy.ts:constructor  @0  ruby `klass`  ts `record`
associations/collection-proxy.ts:constructor  @1  ruby `association`  ts `assocName`
```

Rails (`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:32`)
is `initialize(klass, association, **)` — it receives the ALREADY-BUILT
association object. trails
(`packages/activerecord/src/associations/collection-proxy.ts:238`) is
`constructor(record: Base, assocName: string, assocDef: AssociationDefinition)`
and resolves the association itself via `record.association(assocName)`.

The single construction site is `CollectionProxy._create`
(`collection-proxy.ts:229-236`), which already computes `targetModel` via
`_targetModelFor`; converging means `_create` also resolving the association and
calling `new Ctor(targetModel, association)`, with the ctor deriving `_record`
and `_assocName` from `association`. The subclass ctor comes back from
`collectionProxyClassFor` (`relation/delegation.ts:296`), whose `FamilyCtor` type
has to move with it.

### 2. `associations/errors.rb#initialize` (`AssociationNotFoundError`)

```text
associations/errors.ts:constructor  @0  ruby `record`  ts `associationName`
associations/errors.ts:constructor  @1  ruby `associationName`  ts `corrections`
```

Positions 0 and 1 already carry the Rails names. The row exists only because
trails adds a third parameter:
`constructor(record, associationName, corrections: string[] = [])`
(`packages/activerecord/src/associations/errors.ts:16`), where Rails
(`vendor/rails/activerecord/lib/active_record/associations/errors.rb:7`) is
`initialize(record = nil, association_name = nil)` and computes `corrections`
LAZILY in a `corrections` method off `record.class.reflections.keys`
(`errors.rb:20-26`).

Converging means implementing `corrections` as a memoized reader on the error
and deleting the parameter, which also retires the precompute in
`_associationNotFound` (`packages/activerecord/src/associations.ts:352-356`) and
its `_correctNames` helper's use there. `HasManyThroughAssociationNotFoundError`
(`errors.ts`, built by `_hmtNotFound`, `associations.ts:341-349`) carries the
same shape and Rails computes it lazily too (`errors.rb`), so it belongs in the
same change. `errors.trails.test.ts:15,27` constructs the error with the third
argument and moves with it.

## Acceptance criteria

- `API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params` reports
  no rows for `associations/collection_proxy.rb` or `associations/errors.rb`.
- Both constructors carry Rails' parameter list — count, order and names —
  verified against `vendor/rails`.
- `corrections` is computed the way Rails computes it, not passed in.
- `pnpm parity:api` methods/arity figures unmoved; `parity:api:calls`,
  `parity:api:calls:args` and `parity:api:extra` add no row.
