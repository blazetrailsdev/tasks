---
title: "activemodel: LazyAttributeSet sends key?/keys/each_key/fetch to values on one path, Hash or IndexedRow"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "activerecord", "ruby-compat"]
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

`activemodel-converge-invented-control-flow-arms-rest-residue` converged every row it listed except
the ones in `activemodel/src/attribute-set/builder.ts` that turn on `isIndexedRow(this.values)`.
`LazyAttributeSet`'s `values` is `Record<string, unknown> | IndexedRow` (`builder.ts:20-31`), where
`activemodel/lib/active_model/attribute_set/builder.rb:21-91` sends `key?`, `keys`, `each_key` and
`fetch` to one duck-typed receiver: a Hash, or `ActiveRecord::Result::IndexedRow`
(`activerecord/lib/active_record/result.rb:39-90`), which defines exactly those four.

Rows `pnpm parity:api:arms:report --package=activemodel --top=200` still prints:

- `activemodel/attribute-set/builder.ts#keys` — `+if`. `builder.rb:36-39` is
  `values.keys | types.keys | @attributes.keys`.
- `activemodel/attribute-set/builder.ts#fetchValue` — `+if`. `builder.rb:41-58` is
  `values.fetch(name) { value_present = false }`. The `@casted_values.fetch(name) do` block is
  already ported; the ternary is all that is left.
- `activemodel/attribute-set/builder.ts#attributes` — `+if +loop`. `builder.rb:61-68` is
  `values.each_key { |key| self[key] }`.
- `activemodel/attribute-set/builder.ts#eachKey` — `+if`. This one is `LazyAttributeHash#each_key`
  (`builder.rb:129-132`, `keys.each(&block)`), and the arm is `if (block) keys.forEach(block)`: the
  blockless call `activemodel/src/attribute-set.ts:69` makes, where Ruby returns an Enumerator.
  It does not involve `IndexedRow`.

Not in the report but the same arm: `LazyAttributeSet#isKey` (`builder.ts:75-82`,
`builder.rb:32-34`) and `defaultAttribute`'s `value` default (`builder.ts:141-155`, `builder.rb:73-77`).

ruby-compat's `fetch` / `hasKey` / `eachKey` are the sends a plain-object Hash takes, and none of
them reaches a receiver that defines the method itself. Three shapes were considered and none fit
inside the residue PR:

- **Dispatch to the receiver's own method**, as `isEmpty` does
  (`packages/ruby-compat/src/ruby-empty.ts:27-36`). `hasKey` has 98 call sites, 34 of them
  `hasKey(this, …)`; a class whose `isKey` is written over `hasKey(this, key)` would recurse, and
  `fetch(this, key, ...rest)` is how a subclass's `fetch` reaches `super`.
- **`IndexedRow` as a `Map`**, so the existing Map arms answer. `fetch` already has one; `hasKey`
  and `eachKey` would gain one and `Hash#keys` needs a function. `IndexedRow#keys` then returns an
  iterator where `result.rb:54-56` returns an Array, and `class IndexedRow extends Map` has no
  Rails superclass.
- **`rbFSend(this.values, "fetch", …)`** reads as a call to `send`, not `fetch`, in the call gate.

`IndexedRow` is `packages/activerecord/src/result.ts:15-78`; it reaches the builder from
`packages/activerecord/src/querying.ts:250-252` through `base.ts:1679`.

## Acceptance criteria

- [ ] `LazyAttributeSet`'s `values` is sent `key?` / `keys` / `each_key` / `fetch` on one path,
      whichever of a Hash or an `IndexedRow` it holds; `isIndexedRow` and the `IndexedRow`
      interface in `builder.ts` are gone.
- [ ] `LazyAttributeHash#eachKey` is `keys.each(&block)` with no block test.
- [ ] `pnpm parity:api:arms:report --package=activemodel --top=200` lists none of the four rows
      above.
- [ ] `querying.trails.test.ts`'s two "without materializing a hash per row" tests still pass.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activemodel --top=200
```
