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
