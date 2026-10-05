---
title: "activerecord: remove the four invented branches left in relation batches and delegation (part 1 residue)"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
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

Remainder of `activerecord-converge-invented-control-flow-arms-relation-part-1`, which converged the
rest of its rows and left these four, each receipted
`@inventedArm if — CONVERGEABLE activerecord-converge-invented-control-flow-arms-relation-part-1-residue`.
`pnpm parity:api:arms:report --package=activerecord --direction=invented` hides a receipted row, so
delete the receipt first to see it.

- `relation/batches.ts#ensureValidOptionsForBatchingBang` — `+if`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:321-323`). Rails raises
  `":order must be :asc or :desc or an array consisting of :asc or :desc, got #{order.inspect}"`.
  The port carries the order Symbols as bare `"asc"` / `"desc"` and hand-rolls the inspect with an
  `Array.isArray` ternary so the message still reads `:invalid` / `[:asc, :sideways]`
  (`batches.trails.test.ts:39,49`). The Symbol-ness is observable through `inspect` here, so the
  values want the `":asc"` spelling and one `rbInspect(order)`; that changes the `order:` option's
  value type on `findEach` / `findInBatches` / `inBatches` / `BatchEnumerator`.
- `relation/batches.ts#batchOnUnloadedRelation` — `+if` (`batches.rb:433-434`). Rails is
  `values = records.pluck(*cursor)`, `Enumerable#pluck`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:163-170`), which reads
  `element[key]`. activesupport's `pluck` (`packages/activesupport/src/enumerable-utils.ts`) reads the
  JS property `element[key]`, and on a composite-primary-key record the `id` property is the
  composite, not the `id` column `record[:id]` reads. So the port open-codes
  `cursor.length > 1 ? cursor.map((key) => record.get(key)) : record.get(cursor[0])`. Swapping in
  `pluck` as it stands reds `batches.test.ts` ".find_each with multiple column ordering and using
  composite primary key". `pluck` has to dispatch Ruby's `[]` send first.
- `relation/delegation.ts#generatedRelationMethods` — `+if`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:54-59`). Rails is
  `@generated_relation_methods ||= GeneratedRelationMethods.new.tap { |mod| const_set(…); private_constant … }`,
  one `or`. The port reads a module-level `WeakMap` and fills it inside `if (!methods) { … }`. No
  `tap` exists in ruby-compat or activesupport, so there is no single guarded write for
  `extract-ts-api.ts#guardedWrite` to fold. Either port `Object#tap` and write the body as
  `??=`, or seat the memo as the class's own ivar.
- `relation/delegation.ts#create` — `+if` (`delegation.rb:113-115`). Rails is
  `relation_class_for(model).new(model, *args, **kwargs)`. `Relation#initialize` takes
  `table:` / `predicate_builder:` keywords (`relation.rb:74`); the trails constructor takes them
  positionally, so `create` unpacks an options hash into positions behind an `isPlainObject` guard.
  Converge the constructor onto the keywords and forward them.

## Acceptance criteria

- [ ] Each of the four bodies has Rails' control flow and its `@inventedArm` receipt is deleted.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for `relation/batches.ts`, `relation/delegation.ts`.
- [ ] `pnpm parity:api:arms:throws` green; `batches.test.ts`, `batches.trails.test.ts` and `relation/delegation.test.ts` green.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented && pnpm parity:api:arms:throws
pnpm vitest run packages/activerecord/src/batches.test.ts packages/activerecord/src/batches.trails.test.ts
```
