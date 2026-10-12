---
title: "activerecord: Relation::StrictLoadingScope is a class, and ClassSpecificRelation's ClassMethods define name"
status: ready
updated: 2026-10-12
rfc: "0156-parity-beyond-name-presence"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-relation-encode-with-and-strict-loading-scope` and
`activerecord-delegation-encode-with-and-class-specific-relation-name` (RFC 0170) on 2026-10-11. Those
two keep only their `encode_with` rows, which need Psych's coder. The three rows here are plain Ruby and
wait on nothing.

`parity:api` on trails `079e69e98a` scores `relation.rb` 407/410 and `relation/delegation.rb` 45/47.
This story takes three of those five misses.

### `Relation::StrictLoadingScope`

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1311-1319`) declares a class
with two singleton methods, `self.empty_scope?` and `self.strict_loading_value`, both answering `true`.
`preload_associations` (`relation.rb:1324`) passes the class itself to `Preloader.new` as `scope:`, and
`Preloader::Association` calls `preload_scope.empty_scope?` and `preload_scope&.strict_loading_value` on
it (`associations/preloader/association.rb:110,221,303,311`), the same two messages it sends a real
`Relation`.

trails (`packages/activerecord/src/relation.ts:150-153`) has a module-private object literal instead:

```ts
const StrictLoadingScope = {
  isEmptyScope: true,
  strictLoadingValue: true,
} as const;
```

It is not a class, not a member of `Relation`, and its two members are data properties, so
`parity:api` finds neither method.

### `Delegation::ClassSpecificRelation::ClassMethods#name`

Rails (`relation/delegation.rb:111-115`) answers `superclass.name`, so the generated
`Post::ActiveRecord_Relation` reports the name of the class it was built from.

trails (`packages/activerecord/src/relation/delegation.ts:82`) gets the same answer by stamping each
generated delegate in `initializeRelationDelegateCache`:

```ts
Object.defineProperty(delegate, "name", { value: rbModName(klass), configurable: true });
```

Rails' `initialize_relation_delegate_cache` (`relation/delegation.rb:32-45`) has no such line; the
answer comes from the `ClassMethods` module that `include ClassSpecificRelation` extends onto the
delegate.

## Converged shape

- `StrictLoadingScope` is a class nested on `Relation` at its Rails position, with static
  `isEmptyScope` and `strictLoadingValue` members answering `true`, spelled as `Relation` spells its
  own (`associations/preloader/association.ts:40,162-163,252-265` reads both off either receiver
  without a call). `preloadAssociations` passes the class as `scope`, as it does today.
- `ClassSpecificRelation`'s `ClassMethods` carries `name`, answering the superclass's name, and
  reaches each delegate through the Concern's class-method half (`extend()` / `Extended<>`).
  The `Object.defineProperty(delegate, "name", ...)` line in `initializeRelationDelegateCache` is
  deleted.

## Acceptance criteria

- [ ] `Relation.StrictLoadingScope` is a class with static `isEmptyScope` and `strictLoadingValue`
      members; the object literal at `relation.ts:150` is gone.
- [ ] `ClassSpecificRelation`'s class methods define `name`, and `initializeRelationDelegateCache`
      makes no `defineProperty` call.
- [ ] `relation.rb` scores 409/410 and `relation/delegation.rb` 46/47; the one row left in each is
      `encode_with`.
- [ ] `relation/delegation.test.ts`, `relations.test.ts`, `strict-loading.test.ts` and
      `associations/eager.test.ts` pass.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` are green.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
