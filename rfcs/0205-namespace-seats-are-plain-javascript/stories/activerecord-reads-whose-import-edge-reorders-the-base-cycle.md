---
title: "activerecord-reads-whose-import-edge-reorders-the-base-cycle"
status: draft
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sweep-activerecord-core-seats-to-plain-assignment` converted only the
deferred `ActiveRecord.X` reads that keep the entry-module graph intact. An
AST pass (typescript-5) rewrote every deferred read in
`packages/activerecord/src` to a direct ES import. Each built
`dist/**.js` module was then imported as the entry in a fresh `node`, and a
greedy bisect kept a file's conversion only while no new entry module failed.
Main has 25 entry failures; the full conversion had 220, mostly
`Cannot access 'Relation' before initialization` from
`disable-joins-association-relation.js:5` (`class … extends Relation`).

The RFC's premise, that a deferred read is safe as an ES import, holds for
the read but not for the edge. A new value import into `base.ts` or
`relation.ts` changes module evaluation order, so an `extends` or `include()`
elsewhere in the cycle then reads a binding still in TDZ.

Files whose conversion broke the entry graph, so their reads still go through
the namespace:
connection-adapters/abstract/{connection-handler,connection-pool,database-statements,query-cache,schema-definitions,schema-statements}.ts,
connection-handling.ts, core.ts, database-configurations/{hash-config,database-config}.ts,
inheritance.ts, migration.ts, migration/{pending-migration-connection,command-recorder,join-table}.ts,
model-schema.ts, persistence.ts, reflection.ts, relation/{delegation,finder-methods,query-methods,predicate-builder}.ts,
relation/predicate-builder/{array-handler,polymorphic-array-value,association-query-value}.ts,
schema-dumper.ts, scoping/default.ts, statement-cache.ts, type.ts,
associations/belongs-to-association.ts, dynamic-matchers.ts,
fixture-set/{file,render-context}.ts, translation.ts, plus active-record.ts,
associations.ts, attribute-methods.ts and the others the first pass reverted.

The seats in scope (`rbModConstSet(ActiveRecord, …)` etc.) were not touched.
`ActiveRecord` is a public exported namespace, and a plain assignment writes
no class path, so each seat converts only where `class-paths.generated.ts`
covers the class.

## Acceptance criteria

- [ ] Each remaining read is converted where the cycle can be broken some
      other way (e.g. moving the `extends` target's import), or listed with
      the TDZ it causes.
- [ ] Seats in scope become plain assignments where the generated table
      covers the class, and stay on the helper otherwise.
- [ ] The plain-node entry check over every `packages/activerecord/dist`
      module shows no failure beyond main's.
