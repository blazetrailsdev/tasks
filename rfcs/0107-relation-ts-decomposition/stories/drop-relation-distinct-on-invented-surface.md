---
title: "Delete Relation#distinctOn and _distinctOnColumns — Arel-only name behind a false Relation Mirrors tag"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 5
pr: 6744
claim: "2026-08-19T16:59:58Z"
assignee: "thread-async-through-exec-main-query-argument"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation.ts:589` defines a public `distinctOn`:

```ts
/**
 * PostgreSQL DISTINCT ON — select distinct rows based on specific columns.
 *
 * Mirrors: ActiveRecord::Relation#distinct_on (PostgreSQL only)
 */
distinctOn(...columns: string[]): Relation<T> {
  const rel = this.spawn();
  rel.distinctValue = true;
  rel._distinctOnColumns = columns;
  return rel;
}
```

The `Mirrors:` tag is false. There is no `distinct_on` anywhere under
`vendor/rails/activerecord/lib/active_record/` — the only `def distinct_on` in
the vendored tree is Arel's, at
`vendor/rails/arel/lib/arel/select_manager.rb:163`, which trails already ports
faithfully in `packages/arel/src/select-manager.ts` (pinned by
`packages/arel/src/select-manager.test.ts` and
`packages/arel/src/visitors/postgres.test.ts`). Rails reaches PostgreSQL
`DISTINCT ON` only through the adapter's `columns_for_distinct`
(`postgresql_adapter_test.rb:442`), never through a `Relation` value method.

`pnpm parity:api:extra --package activerecord` confirms it, run on a fresh
build at `37e36d782`: `relation.ts` scores **2 novel / 3 moved**, and
`distinctOn` is one of the moved rows — with exactly one owner,
`Arel::SelectManager#distinct_on` in `arel/select_manager.rb`. No
`ActiveRecord::` owner appears. "Moved" is the grader saying the name exists in
Rails but on a different class in a different file; the `Mirrors:` tag claims
it exists on `ActiveRecord::Relation`, and it does not. On `origin/main` its only
references outside its own definition are `relation.ts:592` (the write),
`relation.ts:3076` (the `_copyStateFrom` copy) and `relation/query-methods.ts`
— zero call sites in `dx-tests`, the association suites, or `scripts/`.

It is also the reason the third sidecar store survives: `_distinctOnColumns`
(`relation.ts:488`) sits outside `@values` because `DISTINCT ON` is not a
`VALUE_METHODS` key, which is exactly the arm
`retire-relation-values-sidecar-stores` defers with "may need its own
follow-up if it cannot converge". **This story is that follow-up.**

## Converged shape

Delete `Relation#distinctOn` and the `_distinctOnColumns` field it feeds.
`Arel::SelectManager#distinct_on` stays — it is real Rails and already ported;
anything genuinely needing PostgreSQL `DISTINCT ON` builds it through Arel or
through the adapter's `columnsForDistinct` seam, as Rails does.

If a real caller turns up during the work, do not keep the relation method:
route it through the adapter/Arel path and say so in the PR.

## Acceptance criteria

- [ ] `Relation#distinctOn` is gone from `packages/activerecord/src/relation.ts`,
      along with the false `Mirrors: ActiveRecord::Relation#distinct_on` tag.
- [ ] `_distinctOnColumns` is gone: the field declaration, the `_copyStateFrom`
      copy, and every read in `relation/query-methods.ts`.
- [ ] `packages/arel/src/select-manager.ts`'s `distinctOn` is untouched and its
      suites still pass — the Arel port is the real Rails surface.
- [ ] `pnpm parity:api:extra --package activerecord` drops the `distinctOn`
      **moved** row from `relation.ts`, taking it from 2 novel / 3 moved to
      2 novel / 2 moved. (It is scored as moved, not novel — do not expect the
      novel count to change.)
- [ ] `pnpm parity:api` still reports `relation.rb → relation.ts` at 401/401
      (100%); `parity:api:calls` / `:args` ratchets stay OK;
      `parity:api` / `parity:test` deltas non-negative.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
