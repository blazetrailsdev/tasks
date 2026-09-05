---
title: "instantiate carries a dead invented overrideTypes parameter Rails' instantiate_instance_of has no counterpart for"
status: draft
updated: 2026-09-04
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' instantiate path takes exactly one types argument
(`vendor/rails/activerecord/lib/active_record/persistence.rb:311-314`):

```ruby
def instantiate_instance_of(klass, attributes, column_types = {}, &block)
  attributes = klass.attributes_builder.build_from_database(attributes, column_types)
  klass.allocate.init_with_attributes(attributes, &block)
end
```

and its caller passes `column_types` straight through
(`persistence.rb:296-302`, `instantiate`).

trails carries a second, invented parameter beside it. `packages/activerecord/src/base.ts:1848`
and `packages/activerecord/src/persistence.ts:39` both declare

```ts
overrideTypes?: Record<string, { deserialize(value: unknown): unknown }>,
```

and `base.ts:1889` merges it over `columnTypes`:

```ts
const additionalTypes = { ...(columnTypes ?? {}), ...(overrideTypes ?? {}) };
```

Nothing in `packages/activerecord/src/**` passes it. `querying.ts:117,119`,
`persistence.ts:113,1195` and `relation.ts:1097` all call through with
`columnTypes` only, so the parameter is dead invented surface on a ported
signature: it widens the arity of `instantiate` / `_instantiate` past
`instantiate_instance_of`'s, and the merge line exists solely to service it.

Surfaced in PR #7487, which rewrote that merge from a `Map` to a `Record` while
converging `AttributeSet::Builder`'s types (`builder.rb:8-11`) and left the
parameter itself alone as out of scope.

## Converged shape

Delete `overrideTypes` from both declarations and collapse the merge to Rails'
single argument:

```ts
(this as any).attributesBuilder().buildFromDatabase(row, columnTypes ?? {});
```

matching `persistence.rb:312`'s `build_from_database(attributes, column_types)`.
If a caller outside `packages/activerecord/src` turns out to depend on it, that
caller is the thing to converge, not the parameter.

## Acceptance criteria

- [ ] `overrideTypes` is gone from `packages/activerecord/src/base.ts` and
      `packages/activerecord/src/persistence.ts`.
- [ ] `buildFromDatabase` receives `columnTypes` directly, mirroring
      `persistence.rb:312`.
- [ ] `instantiate` / `_instantiate` arity matches `instantiate_instance_of`
      (`persistence.rb:311`).
- [ ] All three AR lanes green; `pnpm parity:api:extra:gate` does not increase
      for activerecord.
