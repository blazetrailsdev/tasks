---
title: "Audit existing @noRailsEquivalent tags for convergeable surface"
status: ready
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps:
  - extra-surface-nested-ruby-class-allow-set-gap
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5367 (`migrate-abstractcontroller-allow-entries`) was chartered to migrate
15 allow entries to `@noRailsEquivalent` tags and instead DELETED all of them:
auditing each one showed none described permanent trails-only surface. Every one
was convergeable or removable, so tagging would have moved the excuse from JSON
to JSDoc while leaving the work invisible. The package now reports 14 novel
extras with a story behind each.

The sibling migrations `migrate-activerecord-allow-entries` and
`migrate-globalid-allow-entries` are both done, and PR #5399
(`retire-extra-surface-allow-json`) migrated the last 21 JSON entries, so
`api:extra` now reports 80 matched tags repo-wide. Those tags were migrated on
the original charter — move the entry, preserve the reason — without the
convergeable-vs-permanent test that PR #5367 applied. Some of them describe
surface that should be converged and untagged instead.

A legitimately permanent tag looks like `[Symbol.toPrimitive]` in
`globalid/signed-global-id.ts` — a JS language necessity with no Ruby analogue.
A tag that merely records unfinished porting or a naming collision we could fix
is not permanent.

### Pre-audited: the 21 tags PR #5399 migrated

These were checked against `vendor/rails` while reviewing #5399. The
classification below is evidence-backed and can be taken as the starting
inventory rather than re-derived; the remaining 59 tags still need the same
treatment.

**Permanent — keep the tag (4).** `inheritance.ts`: `qualifiedName`,
`registerModuleTableNamePrefix`, `registerModuleTableNameSuffix`,
`registerSubclass`. Ruby gets these from the object model (`Module#name`,
`module_parents`, the `inherited` hook, `full_table_name_prefix` at
`model_schema.rb:302-307`). No JS analogue exists.

**Tooling gap — belongs to the nested-class comparator fix, not a tag (2).**
`AbstractAdapter.Version` (`connection-adapters/abstract-adapter.ts`) and
`NullPool.NullConfig` (`connection-adapters/abstract/connection-pool.ts`).
Both are REAL Rails nested classes (`abstract_adapter.rb:243`,
`connection_pool.rb:14`); they flag only because `primaryClassPerFile` skips
nested Ruby classes while `collectTsFileNames` still counts the TS nested
class. Delete both tags once
`extra-surface-nested-ruby-class-allow-set-gap` lands.

**Convergeable now (7).**

- `gte` / `lt` on `Version` (`abstract-adapter.ts:165`) — Rails defines only
  `<=>` (`abstract_adapter.rb:252`) and gets `>=`/`<` from `Comparable`. The
  repo already has the mapping precedent: `operator-order-spelling.ts:53` maps
  `ActiveModel::Name`'s `<=>` to `compare`. Port `compare()`, register the
  `ActiveRecord::ConnectionAdapters::AbstractAdapter::Version` mapping, derive
  or drop `gte`/`lt`.
- `statementLimit` x3 (`abstract-mysql-adapter.ts:283`,
  `postgresql-adapter.ts:538`, `sqlite3-adapter.ts:330`) — Rails NEVER exposes
  this. It appears only as `@config[:statement_limit]` read inline at
  `StatementPool` construction (`abstract_mysql_adapter.rb:975`,
  `postgresql_adapter.rb:1056`, `sqlite3_adapter.rb:803`). The public validated
  accessor is a trails invention; make it private and read config at pool
  construction.
- `isNoDatabaseError` x3 (`abstract-adapter.ts:746`,
  `postgresql-adapter.ts:2759`, `sqlite3-adapter.ts:203`) — Rails raises
  `ActiveRecord::NoDatabaseError` at the connect site
  (`postgresql_adapter.rb:63`, `sqlite3_adapter.rb:38`, `:120`) and
  `DatabaseTasks` simply rescues the typed error
  (`tasks/database_tasks.rb:214`). It never classifies a raw driver error. The
  predicate exists only to serve `DatabaseTasks._isMissingDatabaseError`, which
  is itself the deviation — converge both sides and the predicate disappears.

**Should be `@internal`, not a public tag (3).** `columnMethodNames`
(`abstract-adapter.ts:1374`, `abstract-mysql-adapter.ts:581`,
`postgresql-adapter.ts:2560`). Rails spells this as `define_column_methods`
metaprogramming (`abstract/schema_definitions.rb:324` plus the per-adapter
`ColumnMethods` modules), so there is no public Ruby method. TS does need the
reified list, but `@internal` removes it from the compared surface honestly
instead of blessing invented public API.

**Deferred work wearing a permanent exception — needs its own story (1).**
`schemaCacheBound` (`abstract-adapter.ts:1482`). Rails DOES define
`def schema_cache` (`abstract_adapter.rb:298` -> `connection_pool.rb:285`). The
tag's own prose concedes the divergence is `schemaCache`'s return type "until
that is converged". Register the `schemaCache` return-type convergence and drop
this tag when it lands.

**Debatable — decide explicitly, do not leave implicit (4).**

- `schemaStatements` x2 (`abstract-adapter.ts:1443`,
  `postgresql-adapter.ts:4597`) — stands in for `include SchemaStatements`. A
  real architectural deviation, but the repo's `this`-typed mixin pattern
  genuinely does not scale to that surface. If it stays, tighten the reason to
  say WHY it is permanent.
- `createRange` / `dropRange` (`postgresql-adapter.ts:4344`, `:4360`) — the
  sharpest one. Rails has NO range DDL helper anywhere; only
  `create_enum`/`drop_enum` exist (`postgresql_adapter.rb:541`, `:571`). This
  is not a TS limitation, it is an invented feature. Strict fidelity says
  delete it.

## Acceptance criteria

- Every `@noRailsEquivalent` tag in the repo is classified as permanent (a
  language-level or runtime-level fact that no port can remove) or convergeable
  (unfinished porting, a fixable naming collision, a tooling gap).
- The 21 pre-audited tags above are dispositioned per the classification, or
  the classification is overturned with `vendor/rails` evidence at the same
  level of detail.
- Convergeable ones get a story registered and their tag deleted so the surface
  counts again; permanent ones keep the tag with the reason tightened to state
  WHY it is permanent, not merely what it is.
- Findings recorded as an audit report so the classification is reviewable.
- `pnpm api:extra` reports no stale tags afterwards.

Note: dispositioning all of these in one PR would blow the 500-LOC ceiling.
The audit itself is the deliverable; each convergence lands as its own
registered story.
