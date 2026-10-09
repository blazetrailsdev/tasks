---
title: "activerecord: withConnectionSync is a synchronous lease that no CLAUDE.md section ratifies"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: convergeable
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-08T14:35:12Z"
assignee: "internal-schema-cache-is-the-sync-twin-of-schema-reflection-cache"
blocked-by: "withConnectionSync (connection-pool.ts:734) survives, receipt cites this story. Not deletable while Relation#toSql is a ratified sync String API (CLAUDE.md section 'Relation is evaluated by an async query'). trails#8681 retired three call paths (loadSchemaFromCacheSync and cachedTableExists now peek pool.schemaReflection.loadedCache with no lease; quotedTableName is adapter_class.quote_table_name, model_schema.rb:285). Remaining callers after #8681, each forced by a synchronous Rails-facing reader: relation.ts:467 (Relation#toSql, ratified); relation.ts:710,722 (execMainQuery) and relation.ts:1059, relation/finder-methods.ts:537 (applyJoinDependency), relation/query-methods.ts:1138 (arel) - owned by relation-layer-with-connection-receipts-are-not-the-tosql-sites; relation/finder-methods.ts:384 (sync finder block); sanitization.ts:62,66,72,145 (sanitize_sql quoting, sync String API); attributes.ts:61 (_default_attributes, read by the sync constructor); base.ts:2741 (Base.withConnectionSync forwarder); associations/alias-tracker.ts:25 (AliasTracker.create, built under sync arel); associations/join-dependency.ts:125 (table alias length under sync arel); type-caster/connection.ts:28 (type_for_attribute under sync arel); model-schema.ts:36 reflectionAdapter, reached from :86 buildPkWhere (sync predicate), :627 loadSchemaFromAdapter's adapter-identity check, :651 warmColumnsHashSync (sync fake-adapter seed). Unblocks when those readers stop needing a connection synchronously."
closed-reason: null
---

## Context

`ConnectionPool#withConnectionSync`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:734`)
carries `@noRailsEquivalent CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073`.
It is the synchronous connection lease: Rails' `ConnectionPool#with_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:264-292`)
is the only form, and it is synchronous in Ruby because every query is.

The receipt is re-pointed here because the story it cited is a pool-seam receipt
story whose remaining blocker is `acquireConnectionSync` and the
`sync-acquire-cannot-complete-reap-before-retry` chain. `withConnectionSync` is
not gated on that chain: it is gated on its callers, each of which is a
synchronous Rails-facing reader.

**Its ACs in the old story were unsatisfiable as written.** They said to re-cite
it `PERMANENT` against § "`Relation` is evaluated by an async query". Both
relevant CLAUDE.md sections refuse it:

- § "Schema reflection peeks at a warm cache" / **Scope boundary**: "This
  ratifies the schema-cache PEEK only. It does **not** bless the synchronous
  _lease_ a peek may sit behind — `withConnectionSync` (`reflectionAdapter`,
  `model-schema.ts:27-30`), `acquireConnectionSync` … Those stay CONVERGEABLE
  and are owned by their own RFC."
- § "`Relation` is evaluated by an async query": "This ratifies the sync
  builders and `toSql`'s sync surface only; the synchronous _lease_ behind
  `withConnectionSync` stays under § Schema reflection's scope boundary."

So the member stays CONVERGEABLE until its callers retire, and this story is
where that is tracked. Known callers reaching it today: `Relation#toSql`
(ratified, § Relation), `reflectionAdapter` (`model-schema.ts:27-30`), and the
four relation-layer sites in
`relation-layer-with-connection-receipts-are-not-the-tosql-sites`.

## Acceptance criteria

- `withConnectionSync` is deleted, or its receipt names a CLAUDE.md section that
  actually ratifies a synchronous lease — not one of the two that explicitly
  decline to.
- If it survives, the receipt cites this story and the blocker enumerates every
  remaining caller with its `file:line`, each with the synchronous Rails-facing
  reader that forces it.
- No receipt in `packages/activerecord/src` cites
  `sync-reads-of-async-reflection-retire-with-rfc-0073` for `withConnectionSync`.
- A new sync lease is not added beside an async one. `acquireConnectionSync`
  stays with the pool-checkout chain and is out of scope here.
- `pnpm parity:api:extra:gate` is green (activerecord is rowless).
