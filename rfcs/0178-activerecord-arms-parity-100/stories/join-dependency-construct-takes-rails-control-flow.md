---
title: "activerecord: JoinDependency#construct and #construct_model take Rails' control flow"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` still reports
`associations/join-dependency.ts#construct — +if +if +if +if +if`. It was listed in
`activerecord-converge-invented-control-flow-arms-associations-part-4`, whose PR converged the
other join-dependency rows (`makeConstraints`, `walk`, `findReflection`, `build`, `walkTree`,
`JoinAssociation#joinConstraints`) and left this one out to stay under the LOC ceiling.

Rails' `construct` and `construct_model`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb:242-298`)
against `packages/activerecord/src/associations/join-dependency.ts`:

- `construct` skips non-`JoinAssociation` children (`if (!(node instanceof JoinAssociation)) continue`).
  `JoinPart#children` is already `JoinAssociation[]`, so the guard is dead.
- `other.loaded!` (`:248`) and `nil_association.loaded!` (`:265`) are the helpers
  `_markCollectionLoaded` / `_markAssociationLoaded`, each with a `typeof parent.association`
  guard, a `try` / `catch AssociationNotFoundError`, and a `proxy.target = []` write Rails does not
  make. A trails `CollectionAssociation` target already starts `[]`, so `loadedBang()` is the port.
- `keys` / `id` (`:255-261`) use two `Array.isArray` ternaries where Rails has `Array(...)`
  (`kernelArray`), and `id` is computed after the nil check through `_keyFor` /
  `_compositeKeys` / `NO_PRIMARY_KEY_ID`, where Rails builds `id` inside the `if node.primary_key`
  arms (`id = keys.map { nil }` for the no-PK arm, which is `[nil]` and truthy).
- `seen[ar_parent][node][id]` (`:269-272`) is two hand-rolled `if (!x) { x = new Map(); … }`
  default fills. Rails' `seen` and `model_cache` are `Hash.new { … }` default procs
  (`:108-115`), `seen` under `compare_by_identity`; ruby-compat's `Hash` takes a default proc and
  keys an Array `id` by `eql?`, which is also what retires `_keyFor`.
- `seen[ar_parent][node][id] = model if id` (`:271`) is written unconditionally.
- `construct_model` (`:278-298`) is split across `_setInverseBeforeCallbacks` and
  `_wireAssociationProxy`, both with the same `typeof` / `try` / `catch` guards, and sets
  `model._readonly = true` where Rails calls `model.readonly!`.

`instantiate` builds `seen` / `modelCache` (`:108-115`) and is owned by
`join-dependency-optional-alias-tracker-and-row-hash-parent-key`; the two stories touch the same
lines, so land them in order rather than in parallel.

## Acceptance criteria

- [ ] `construct` and `constructModel` match `join_dependency.rb:242-298` branch for branch, with
      Rails' locals (`other`, `nilAssociation`, `keys`, `id`, `model`).
- [ ] `seen` and `modelCache` are ruby-compat `Hash`es with Rails' default procs; `_keyFor`,
      `_compositeKeys` and `NO_PRIMARY_KEY_ID` are gone.
- [ ] `_markCollectionLoaded`, `_markAssociationLoaded`, `_setInverseBeforeCallbacks` and
      `_wireAssociationProxy` are deleted.
- [ ] The invented-direction arms report shows no row for `join-dependency.ts#construct`.
- [ ] `packages/activerecord/src/associations/eager.test.ts`, `cascaded-eager-loading.test.ts`,
      `strict-loading.test.ts` and the `join-dependency-*.trails.test.ts` files pass.
