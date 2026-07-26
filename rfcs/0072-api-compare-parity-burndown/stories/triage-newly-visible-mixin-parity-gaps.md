---
title: "Triage the 258 newly-visible mixin parity gaps surfaced by #5334"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5334 fixed `resolveModuleName` so partially-qualified `include`/`extend`
names (`include PostgreSQL::Quoting` inside
`module ActiveRecord::ConnectionAdapters`) resolve via a namespace-prefix walk
instead of being dropped. Because `resolveModuleName` also feeds
`flattenIncludedMethodInfos`, that expanded the Rails-side **expected** surface,
not just the extra-surface accounting.

`pnpm api:compare` before → after #5334:

|            | before              | after               |
| ---------- | ------------------- | ------------------- |
| Data layer | 7473/7473 (100%)    | 7717/7810 (98.8%)   |
| Overall    | 11426/16974 (67.3%) | 11678/17484 (66.8%) |
| Files      | 759/1017            | 761/1019            |

+510 expected methods became visible; +252 were already ported. The remaining
**258 (93 of them in the data layer)** are genuine, previously-invisible parity
gaps — methods Rails mixes into a host via a partially-qualified include that
trails has never implemented. The old data-layer 100% was an artifact of those
mixins being invisible to the comparator, not evidence of completeness.

The hosts involved are the ones the fix unblocked: `ActiveRecord::Base`
(`Locking::Optimistic`, `Locking::Pessimistic`, `Encryption::EncryptableRecord`,
`Marshalling::Methods`, `QueryCache::ClassMethods`, `Delegation::DelegateCache`,
`Aggregations::ClassMethods`), `PostgreSQLAdapter` (`PostgreSQL::Quoting`,
`ReferentialIntegrity`, `SchemaStatements`, `DatabaseStatements`),
`SQLite3Adapter`, `AbstractMysqlAdapter`, `Mysql2Adapter`,
`ConnectionPool`/`NullPool`, `Relation` (`SignedId::RelationMethods`,
`TokenFor::RelationMethods`), `Type::{Date,DateTime,Time}`
(`Internal::Timezone`).

This story is the triage pass, not the porting: the 258 need to be split into
"really unported, worth a story" vs. "implemented elsewhere in TS and merely
mis-attributed by file layout" vs. "legitimately out of scope" before anyone
sizes the work.

## Acceptance criteria

- Enumerate the 258 newly-visible unported methods from `api-compare/output/`,
  grouped by host and by the mixin that contributes them.
- Classify each group: genuinely unported / implemented under a different file
  or name (comparator attribution issue) / out of scope per
  `unported-files.ts` or an existing SKIP_GROUPS entry.
- For the genuinely-unported groups, file per-cluster porting stories under the
  best-fit RFC with `--est-loc` sized from the Rails method bodies.
- For the mis-attributed ones, either fix the attribution or record the reason
  in the appropriate exclusion file with a justification.
- Record the resulting expected data-layer percentage once the out-of-scope and
  mis-attributed groups are accounted for, so the 98.8% number has a known
  floor.
