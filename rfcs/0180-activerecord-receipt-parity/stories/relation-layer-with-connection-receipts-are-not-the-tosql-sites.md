---
title: "activerecord: the four relation-layer with_connection receipts are not toSql's, and need their own owner"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: convergeable
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four `@missingRailsCall with_connection` receipts in the relation layer cite
`sync-reads-of-async-reflection-retire-with-rfc-0073`, which is the pool-seam
receipt story in RFC 0123. They do not belong to it: that story's remaining
blocker is `acquireConnectionSync` and the pool-checkout chain, and these four
sites are independent of it. Re-pointed here so they have an owner that is not
blocked.

Sites on trails `deb7897894`:

- `packages/activerecord/src/relation.ts:477` `loadAsync`
- `packages/activerecord/src/relation.ts:699` `execMainQuery`
- `packages/activerecord/src/relation/finder-methods.ts:500` `applyJoinDependency`
- `packages/activerecord/src/relation/query-methods.ts:1134` `arel`

Each reaches the adapter through `ConnectionPool#withConnectionSync` where the
Rails body wraps the work in `with_connection`:

- `Relation#load_async` — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1138-1152`, `with_connection` at `:1139`
- `Relation#exec_main_query` — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1423-1452`, `model.with_connection` TWICE, at `:1436` (the `eager_loading?` arm) and `:1449`
- `FinderMethods#apply_join_dependency` — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:457-478`, `model.with_connection` at `:474`
- `QueryMethods#arel` — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1594-1596`: `@arel ||= with_connection { |c| build_arel(c, aliases) }`

**These are NOT covered by the landed CLAUDE.md § "`Relation` is evaluated by an
async query".** That section ratifies `Relation#toSql` and the synchronous eager
builders it runs through, and `toSql`'s own omitted calls are already re-cited
`PERMANENT` at `relation.ts:1057-1058`. None of the four sites above is `toSql`.
The section also explicitly defers the synchronous _lease_ itself to
§ "Schema reflection peeks at a warm cache"'s scope boundary, which names
`withConnectionSync` as staying CONVERGEABLE.

**Prior decision on `arel`, do not re-litigate blind.**
`port-with-connection-acquisition-seam-for-the-arel-reader` (RFC 0123) was
CLOSED as "Ratified/delivered", reasoning that CLAUDE.md § "`Relation` is
evaluated by an async query" (trails#7834) settles that a sync `with_connection`
seam "can only serve an already-leased connection — 'the settled shape, not a
gap'", and that `arel()`'s memoized `withConnectionSync` IS that shape. That
close explicitly parked the surviving `@missingRailsCall with_connection`
receipt on `sync-reads-of-async-reflection-retire-with-rfc-0073` rather than
removing it, so the receipt stayed CONVERGEABLE and this story inherits only its
ownership. **That close over-read the section, and the section's own words say so.** Read
at CLAUDE.md:805-827, it enumerates exactly four members — `Relation#toSql`,
`_buildEagerOperandManager`, `_applyEagerJoinDependency`,
`_materializeDeferredDistinctPkPredicates`, "all `relation.ts`" — and `arel`
lives in `query-methods.ts`, so it is not among them. It then closes: "This
ratifies the sync builders and `toSql`'s sync surface **only**", and the
section's final paragraph grants `PERMANENT` to "**`toSql`'s** omitted
`apply_join_dependency` / `with_connection` calls". The "settled shape, not a
gap" sentence the close leaned on is about whether a sync seam is expressible
for `toSql`, not a blanket ratification of every caller that uses one. So
`arel`'s omitted `with_connection` is **not** ratified, and converging it is in
scope for this story. Do not promote it to `PERMANENT` against that section
without amending the section itself.

`loadAsync` is additionally touched by
`load-async-disabled-arm-calls-load-and-dedupes-in-flight-load` (RFC 0180),
whose diff keeps this receipt in place — it converges the `load` call, not the
`with_connection` one. Land order between the two does not matter; whichever is
second rebases onto the other's receipt block.

## Acceptance criteria

- Each of the four sites either calls `withConnection` as Rails does, or carries
  a receipt naming a ratified CLAUDE.md section, or a receipt citing this story.
- No receipt in `packages/activerecord/src` cites
  `sync-reads-of-async-reflection-retire-with-rfc-0073` for a relation-layer
  `with_connection` omission.
- Where a site cannot converge because the enclosing body is synchronous, the
  blocker names the specific synchronous reader that forces it, with its
  `file:line` — not a general appeal to "JS has no synchronous await".
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green.
