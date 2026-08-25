---
title: "Drop the ensureSchemaLoaded / deferred-distinct-PK preludes from ids' and pluck's read arms"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into hoist-schema-load-and-deferred-pk-materialization-out-of-ported-bodies (identical converged shape: hoist ensureSchemaLoaded + _materializeDeferredDistinctPkPredicates out of ids/pluck)"
---

## Context

`Relation#ids` (`packages/activerecord/src/relation.ts`) was ported arm for arm
from `activerecord/lib/active_record/relation/calculations.rb:371-405` in PR
6565, but its third arm is wrapped in two preliminaries the Rails body has no
counterpart for:

```ts
return this._withQueryConnection(async () => {
  await (this._model as unknown as { ensureSchemaLoaded(): Promise<void> }).ensureSchemaLoaded();
  await this._materializeDeferredDistinctPkPredicates();
  const columns = this.arelColumns(primaryKeyArray);
  ...
});
```

Rails' third arm is just `arel_columns` → `spawn` → `select_values =` →
`where_clause.contradiction?` → `skip_query_cache_if_necessary { model.with_connection { c.select_all(...) } }`
(`:394-405`). Nothing loads the schema and nothing materializes a deferred
predicate, because Ruby resolves `model.attribute_types` lazily on first read and
Rails has no deferred distinct-PK marker at all.

Both preliminaries were inherited from the `pluck` delegation `ids` replaced —
`pluck` carries the identical pair (`relation.ts`, `_pluckInner`) — so this is one
shape in two bodies, not an `ids`-only wart. They were kept in #6565 deliberately:
dropping them silently regresses a sibling's cases, since `type_cast_pluck_values`
reads `model.attribute_types` and a deferred distinct-PK marker must resolve to a
literal id list before the arel compiles.

`_withQueryConnection` itself is already owned by
`converge-with-query-connection-onto-with-connection` (RFC 0106, in-progress) —
this story is the other two.

## Converged shape

`ensureSchemaLoaded()` and `_materializeDeferredDistinctPkPredicates()` stop being
per-terminal preludes:

- schema reflection resolves where Rails resolves it (on the attribute-type read
  inside `type_cast_pluck_values`), so no read terminal has to pre-load it; and
- the deferred distinct-PK marker resolves at `where()`-build time as Rails
  materializes it (`finder_methods.rb:463`), not at each terminal that might
  compile it — see the sibling
  `route-apply-join-dependency-through-distinct-relation-for-primary-key`.

Then `ids`' third arm is `calculations.rb:394-405` with no wrapper, and `pluck`'s
tail loses the same two lines.

## Acceptance criteria

- [ ] `Relation#ids`' third arm has no `ensureSchemaLoaded` /
      `_materializeDeferredDistinctPkPredicates` prelude.
- [ ] `Relation#pluck` loses the same pair, or the story documents why one
      terminal still needs it.
- [ ] `calculations.test.ts` `ids*` and `pluck*` tests stay green on all three
      adapters, including the deferred distinct-PK cases.
- [ ] `pnpm parity:api:calls` green; no new baseline rows.
