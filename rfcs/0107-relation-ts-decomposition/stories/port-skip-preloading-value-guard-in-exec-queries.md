---
title: "Port the skip_preloading_value guard — skipPreloading! is write-only and inert (relation.rb:1414)"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 3
pr: 6737
claim: "2026-08-19T12:59:17Z"
assignee: "wave-4c-ar-core-residue-transactions-and-core"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by auditing the call-argument baseline for this RFC's file
(`pnpm parity:api:calls:args`), which led into `exec_queries`.

`skip_preloading_value` is **write-only in trails**. Rails declares it
(`vendor/rails/activerecord/lib/active_record/relation.rb:72`), writes it in
`skip_preloading!` (`relation/query_methods.rb:1513-1514`), and reads it in
exactly one place — the `exec_queries` preload guard:

```ruby
# vendor/rails/activerecord/lib/active_record/relation.rb:1414
preload_associations(records) unless skip_preloading_value
```

trails ported everything except the read. On `origin/main`:

- `relation.ts:520` — `skipPreloadingValue = false` (the field)
- `relation/query-methods.ts:1973-1975` — `skipPreloadingBang()` sets it true
- `relation/query-methods.ts:362` — declared on the host interface
- `relation/query-methods.ts:2732`, `associations/collection-proxy.ts:2836` —
  wired into the delegation registries
- `relation.ts:3096` — copied by `_copyStateFrom`
- `relation/mutation.test.ts:196-197`, `relation.test.ts:458` — tests that pin
  the writer sets the value

`git grep skipPreloading packages/` returns no read outside those. trails'
`execQueries` (`relation.ts:1112`) guards on list/record emptiness instead:

```ts
if (preloadAssocs.length > 0 && records.length > 0) {
  await this.preloadAssociations(records, preloadAssocs);
```

So `skipPreloading!()` is inert: a relation that asked not to preload still
issues every preload query. The flag's whole purpose is defeated, and the
existing tests do not catch it because they assert the writer, never the effect.

**Blast radius today is latent, not live.** Rails' only production caller is
`actionview/lib/action_view/renderer/collection_renderer.rb:81`
(`relation.skip_preloading! unless relation.loaded?`), and trails has not
ported `collection-renderer` yet (`git ls-tree origin/main -- packages/actionview/src`
has no match). This should be fixed _before_ that port lands, not after — once
the renderer arrives, the missing guard silently becomes N+1 preload queries on
every collection render.

## Converged shape

Port the guard at `relation.rb:1414`. The preload step in `execQueries` becomes
conditional on `skipPreloadingValue`, matching Rails' `unless`:

```ts
if (!this.skipPreloadingValue && preloadAssocs.length > 0 && records.length > 0) {
```

Rails has no length guards at this call site — `preload_associations` returns
early on an empty list itself, and `preloadAssociations` already does the same
(`relation.ts:2274`, `if (assocNames.length === 0) return`). Prefer collapsing
to Rails' shape (`unless skip_preloading_value` alone) if the `records.length`
arm turns out to be redundant; keep it only if a test proves it load-bearing,
and say which one in the PR.

## Acceptance criteria

- [ ] `execQueries` skips `preloadAssociations` when `skipPreloadingValue` is
      true, mirroring `relation.rb:1414`.
- [ ] A regression test asserts the **effect**, not the writer: a relation with
      `includes(...)` plus `skipPreloadingBang()` issues no preload query and
      leaves the association unloaded. It must fail on baseline — the existing
      `mutation.test.ts:196-197` / `relation.test.ts:458` pins pass today.
- [ ] The length guards are either justified at the call site or collapsed onto
      Rails' single `unless`.
- [ ] `pnpm parity:api:calls` / `:args` ratchets stay OK — this adds a read of
      an already-ported value, so no baseline row should be added or reseeded.
- [ ] `parity:api` still reports `relation.rb → relation.ts` at 401/401 (100%);
      `parity:test` delta non-negative.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
