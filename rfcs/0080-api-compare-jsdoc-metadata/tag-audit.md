# `@noRailsEquivalent` tag audit

Audit date: 2026-07-27. Story:
`audit-existing-tags-for-convergeable-surface` (RFC 0080).

## Why this audit exists

PR #5367 was chartered to migrate 15 `extra-surface-allow.json` entries to
`@noRailsEquivalent` JSDoc tags and instead deleted all 15: auditing each one
showed none described permanent trails-only surface. Every one was convergeable
or removable, so tagging would have moved the excuse from JSON to JSDoc while
leaving the work invisible.

The sibling migrations shipped on the original charter — move the entry,
preserve the reason — without applying that test. This audit applies it to
every surviving tag.

**The test.** A tag is permanent only if it records a language-level or
runtime-level fact that no port can remove. A tag that records unfinished
porting, a fixable naming collision, an architectural choice trails made, or a
comparator gap is convergeable: the tag comes off and the work gets a story.

## Inventory

79 tags at audit time, in 30 files across 8 packages, measured by
`pnpm api:extra` (`tagged.total`). One was already stale.

| Disposition                                        | Tags |
| -------------------------------------------------- | ---- |
| Permanent — JS language or runtime protocol        | 28   |
| Permanent — Ruby object model / TS structural fact | 8    |
| Convergeable — story already registered            | 11   |
| Convergeable — story registered by this audit      | 31   |
| Stale — since resolved on main                     | 1    |

Convergeable is 42 of 79 (53%). The tag population was not, as migrated, a
record of permanent divergence.

### State at merge

The count above is the audit snapshot at 79 tags. Three findings shipped while
this PR was in review, taking the tree to **76 tags, 76 matched, 0 stale**:

| Finding                        | Shipped by | Effect                                                                  |
| ------------------------------ | ---------- | ----------------------------------------------------------------------- |
| `LocatorModel.find` / `.where` | #5467      | Two member tags collapsed into one interface-level tag                  |
| `NullConfig` stale tag         | #5467      | Deleted on main; this PR no longer carries the deletion                 |
| `setModelFinder`               | #5471      | Retired; replaced by one `registerConstant` tag on the ported inflector |

That is the audit working as intended — each disposition leaves as its own
story rather than as a bulk edit here. The classification below is unchanged;
the sections for those three record what landed.

### How to reproduce the inventory

`pnpm api:extra` reports the totals but not the per-tag list (matched tags are
subtracted from `extras` before the JSON is emitted). To re-derive the list,
pair each `@noRailsEquivalent` occurrence under `packages/*/src` with the next
declaration below its JSDoc block. Two shapes to watch: the tag reads on class
/ interface / namespace declarations as well as members (since PR #5462), and
one tagged member covers only itself — `lt` (abstract-adapter.ts:186) is
untagged because it delegates to the tagged `gte`.

### Verification standard

Every claim below is stated against a `vendor/rails` (or `vendor/globalid`)
`file:line` read during this audit, not against the tag's own prose. Where a
tag's prose was accurate, it is cited and confirmed; where the prose was
accurate but the disposition wrong, that is called out explicitly — the common
failure mode here is a tag that correctly describes a mechanism and then draws
"therefore permanent" from it.

## Permanent — JS language or runtime protocol (28)

These implement a JavaScript protocol that has no Ruby method to mirror. Ruby
reaches the same capability through `Enumerable#each`, `to_s`/`to_i` coercion,
or has no analogue at all. No port removes them.

- `[Symbol.iterator]` (10) — `actionpack` journey/routes, middleware/cookies,
  middleware/stack; `actionview` path-set; `activemodel` attribute-set, errors;
  `activerecord` collection-proxy, join-dependency, result; `trailties`
  engine/trailties
- `[Symbol.asyncIterator]` (4) — `activerecord` collection-proxy,
  batches/batch-enumerator, relation; `rack` body-proxy
- `catch` / `finally` (6) — `activerecord` collection-proxy,
  batches/batch-enumerator, relation. The JS thenable protocol; Ruby has no
  thenable.
- `[Symbol.for("nodejs.util.inspect.custom")]` (3) — abstract-adapter,
  abstract/connection-pool, encryption/cipher/aes256-gcm
- `valueOf` (5) — `activerecord` encryption/extended-deterministic-queries;
  `activesupport` core-ext/string/output-safety, duration, string-inquirer,
  time-with-zone

Disposition: keep, reasons unchanged. The acceptance bar for a permanent tag is
that it says WHY it is permanent, not merely what it is, and all 28 already
clear it: each names the Ruby mechanism that makes the TS member unmatchable
(`Enumerable#each` for the iterator pairs, `to_s`/`to_i` coercion for
`valueOf`, "a JS runtime protocol, not a Rails method" for the Node inspect
hook). The only permanent tags whose reasons did not clear that bar were the
two `schemaStatements` ones, tightened in this PR.

## Permanent — Ruby object model / TS structural fact (8)

### `inheritance.ts` (4)

`qualifiedName`, `registerModuleTableNamePrefix`,
`registerModuleTableNameSuffix`, `registerSubclass`. Ruby gets all four from
the object model: `Module#name` and `Module#module_parents` for the constant
path, a module-level `table_name_prefix`/`table_name_suffix` read off the
enclosing module object (`full_table_name_prefix`, model_schema.rb:302-307),
and the `inherited` hook (inheritance.rb:287) for subclass registration. JS
classes carry no module path, there are no module objects to respond to those
readers, and there is no class-definition hook. Confirmed permanent.

### `associations.ts` — `registerModel` (1)

Ruby resolves an association's class through constant lookup:
`MacroReflection#compute_class` (reflection.rb:434) is literally
`name.constantize`, and `AssociationReflection#compute_class` (:490) overrides
it only to reject polymorphics first. `constantize` walks Ruby's constant
namespace, backed by ActiveSupport autoloading. ESM has neither a constant
namespace to walk nor an autoload hook, so application code has to say which
classes exist. Confirmed permanent. (Its file-sibling `initializeAssociations`
is **not** — see below.)

### `globalid/uri/gid.ts` — `constructor` (1)

`class GID < Generic` (globalid uri/gid.rb:7) declares no `initialize` — it
inherits the public one from `URI::Generic` in the Ruby stdlib, which the
api-compare extractor does not read. There is no TS `URI` base class to inherit
from, and porting Ruby's stdlib URI hierarchy is not in scope for this repo, so
the constructor is declared locally. Confirmed permanent.

### `schemaStatements` (2) — abstract-adapter, postgresql-adapter

The debatable case the story flagged. **Decision: permanent, reason tightened
in this PR.** Rails gains these bodies with `include SchemaStatements`. The
repo's substitute for `include` is a `this`-typed function assigned per method;
`abstract/schema_statements.rb` defines 76 of them. That many hand-assigned
statics is not a readable class, and no future port removes the limitation, so
trails keeps the module as a companion class and `schemaStatements(host?)`
returns it bound to a host adapter. The previous reason said what the accessor
was, not why it was permanent; both declarations now say why.

## Convergeable — story already registered (11)

| Tag(s)                                                          | File                         | Owning story                                            |
| --------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `poolAbsent`, `realPool`                                        | abstract/connection-pool.ts  | `converge-nullpool-protocol-retire-poolabsent-realpool` |
| `setPrimaryKeys`, `setDataSourceExists`                         | schema-cache.ts              | `retire-schema-cache-test-only-sync-writers`            |
| `uri`, `create`, `modelId`, `modelName`, `params`, `modelClass` | globalid/signed-global-id.ts | `globalid-sgid-inherits-globalid`                       |
| `setModelFinder`                                                | globalid/locator.ts          | `port-constantize-retire-model-finder`                  |

The six `signed-global-id.ts` tags all say "re-declared because the TS classes
are peers, not a hierarchy". Ruby: `class SignedGlobalID < GlobalID`
(signed_global_id.rb:4), and all six members come from the base —
`attr_reader :uri` (global_id.rb:45),
`delegate :model_name, :model_id, :params, to: :uri` (:46), `def model_class`
(:56), and `create` from the base's polymorphic `new`. Peer-ness is a trails
structural choice, not a TS limitation — TS has class inheritance — so all six
come off when that story lands.

`setModelFinder` looks like it should share `registerModel`'s permanent
disposition — both substitute for constant lookup — but it does not, and the
distinction is the point of this audit. `registerModel` is the one registry the
port needs. `setModelFinder` is a **second** registry for the same job, serving
`GlobalID#model_class`'s `model_name.constantize` alone. Two registries for one
missing language feature is duplication, not a language fact; the existing
`port-constantize-retire-model-finder` story folds one into the other.

**Shipped: PR #5471**, and it confirms the classification. `constantize` /
`safeConstantize` are now ported in `activesupport/src/inflector.ts`,
`setModelFinder` is retired, and the second registry is gone — replaced by one
`registerConstant` tag on the ported inflector. That new tag is the permanent
one this audit predicted `registerModel` to be: a single registry standing in
for Ruby's constant namespace, in the file that owns constant lookup.

## Convergeable — story registered by this audit (31)

### `statementLimit` ×3 — `retire-public-statement-limit-accessor`

abstract-mysql-adapter.ts:283, postgresql-adapter.ts:533,
sqlite3-adapter.ts:345. Rails never exposes this. It appears only as
`StatementPool.new(self.class.type_cast_config_to_integer(@config[:statement_limit]))`
at abstract_mysql_adapter.rb:975, postgresql_adapter.rb:1056,
sqlite3_adapter.rb:803 — a `database.yml` key, not adapter API. The public
validated accessor is invented; read config at pool construction instead.

### `isNoDatabaseError` ×3 — `converge-no-database-error-to-connect-site`

abstract-adapter.ts:767, postgresql-adapter.ts:2764, sqlite3-adapter.ts:210.
Rails raises `NoDatabaseError` at the connect site (postgresql_adapter.rb:63,
sqlite3_adapter.rb:38 and :120) and `DatabaseTasks` rescues the typed error
(tasks/database_tasks.rb:214). It never classifies a raw driver error. The
predicate exists only to serve `DatabaseTasks._isMissingDatabaseError`, which
is itself the deviation; converge both and the predicate disappears.

### `columnMethodNames` ×3 — `mark-column-method-names-internal`

abstract-adapter.ts:1396, abstract-mysql-adapter.ts:586,
postgresql-adapter.ts:2563. Rails spells this as `define_column_methods`
metaprogramming (abstract/schema_definitions.rb:324 plus the per-adapter
`ColumnMethods` modules), so no public Ruby method exists. TS does need the
reified list — but it should be `@internal`, not tagged public API.

### `gte` (and its delegate `lt`) — `port-version-compare-and-retire-gte-lt`

abstract-adapter.ts:167. Rails' `AbstractAdapter::Version`
(abstract_adapter.rb:243-259) does `include Comparable` and defines only `<=>`;
`>=` and `<` come free. The repo already has the mechanism —
`scripts/api-compare/operator-order-spelling.ts:53` maps `ActiveModel::Name`'s
`<=>` to `compare`. Port `compare()`, register the same mapping for `Version`,
then derive or drop `gte`/`lt`.

### `createRange` / `dropRange` — `delete-invented-pg-range-ddl-helpers`

postgresql-adapter.ts:4301, :4318. The sharpest finding. Rails has no range
DDL helper anywhere — a grep of `activerecord/lib/active_record` returns
nothing. The only type-DDL helpers are the enum quartet
(postgresql_adapter.rb:541 `create_enum`, :571 `drop_enum`, plus the renames),
stubbed on the base at abstract_adapter.rb:576-580. This is not a TS
limitation; it is an invented feature modelled on Rails' enum helpers. Strict
fidelity says delete it. **Decision: delete, unless the convergence story finds
a concrete trails requirement Rails does not have.**

### `schemaCacheBound` — `converge-schema-cache-getter-onto-bound-reflection`

abstract-adapter.ts:1506. Rails DOES define `def schema_cache`
(abstract_adapter.rb:298 into connection_pool.rb:285). The tag's own prose
concedes the divergence is `schemaCache`'s return type "until that is
converged" — deferred work wearing a permanent exception, the exact pattern
this audit exists to catch.

### schema-cache sync/ledger shims ×9 — `retire-schema-cache-sync-and-ledger-shims`

`getCachedColumnsHash` (:300), `getCachedDataSourceExists` (:314),
`getCachedPrimaryKeys` (:358), `loadedCache` (:803), `setColumns` (:476),
`recordTouchedTables` (:425), `takeTouchedTables` (:439), `loadAllBang` (:785),
`eagerLoadSchemaCache` (:735). Every reason is honest about its mechanism and
every one traces to a single root cause: trails' accessors are async where
Rails' block on a checkout. Rails' set is `primary_keys(pool, table_name)`
(schema_cache.rb:298), `data_source_exists?(pool, name)` (:309), `add(pool,
table_name)` (:326), `columns_hash(pool, table_name)` (:352) — each free to
block — so it needs no sync peek, no seeding writer and no ledger. That split
is convergeable work (see RFC 0073, the permanent connection-checkout flip),
not a language fact.

The two composites are worth naming separately, because their reasons are
accurate and still do not make them permanent. `loadAllBang` combines
`SchemaReflection#load!` (schema_cache.rb:27) with `add_all(pool)` (:396) —
both exist in Rails, just not fused, so this is a shape divergence a port can
undo. `eagerLoadSchemaCache` has no Rails counterpart at all: Rails' only knob
is the `lazily_load_schema_cache` config flag
(`activerecord/lib/active_record.rb:189`), reading a committed dump rather than
warming from the database. Eager DB warming exists solely because trails' sync
accessors cannot fall back on blocking reflection — the same root cause again.

### connection-pool async-resolution shims ×6 — `retire-connection-pool-async-resolution-shims`

`setConnectionHandlerResolver` (:290), `adapterReady` (:346),
`queryCacheDisabled` (:586), `leaseConnectionSync` (:673),
`discardBangDraining` (:1068), `drainPendingCloses` (:1258). All six follow
from two trails-side choices — async adapter loading via dynamic `import()`,
and async lease/close — plus, for `queryCacheDisabled`, a trails-only
"disabled" config alias. None follow from anything JavaScript forbids: Ruby's
`lease_connection` (connection_pool.rb:315) and `discard!` (:484) are ordinary
synchronous methods with no async twin, drain ledger or readiness flag, and
`query_cache` is a plain config reader (`database_configurations/hash_config.rb:84`)
that Rails compares against `false` inline — it has no "disabled" spelling to
normalize.

`queryCacheDisabled` is the cheapest of the six: if the "disabled" alias is
itself a trails invention, normalizing it where config is read deletes the
predicate outright. Its story calls that out as a separate decision.

### `initializeAssociations` — `retire-initialize-associations-module-cycle-hook`

associations.ts:55. `initialize_associations` is defined nowhere in Rails, but
the reason it exists is one specific trails cycle — associations to
`CollectionProxy` to `Relation` to `Base` back to associations — which forces
`CollectionProxy` registration to be late-bound. That is a module-layout
artifact of this port, not a language fact, and it separates this tag from its
permanent file-sibling `registerModel`.

### `find` / `where` on `LocatorModel` — `extra-surface-skip-duck-typed-interface-members`

globalid/locator.ts:19, :25. Not locator methods at all: members of a
duck-typed interface declaring the Active Record surface Rails' `BaseLocator`
calls as `model_class.find gid.model_id` and `model_class.where(primary_key =>
ids)`. Ruby needs no such declaration — but that makes it a comparator gap, not
permanent trails-only surface. Every duck-type interface in the repo would
otherwise need the same tag. The rule belongs in the extractor.

**Shipped: PR #5467.** A tagged `interface` declaration now covers its members,
so the two member tags collapsed into one tag on `LocatorModel`. Classes are
deliberately excluded from that spread — a tagged class name is usually an
extractor-shape artifact whose members DO have Ruby counterparts, so inheriting
there would mask real drift.

## Stale — resolved on main (1)

`NullConfig` (abstract/connection-pool.ts). Flagged stale by `pnpm api:extra`
during this audit and deleted here; **PR #5467 deleted the same tag on main
first**, so the rebased branch carries main's version and this PR no longer
touches it.

Main's note also corrects the causal account this audit originally gave. The
audit attributed the staleness to PR #5458 closing the nested-Ruby-class
allow-set gap. The real reason is narrower and permanent: `collectTsFileNames`
builds the extra set from **member** surface, and an entry for a re-attached
sibling class never appears there — so the tag could never have matched,
before or after #5458. `extra-surface.ts:355-359` now says so at the code.

The mechanical note about the sibling-export shape survives as ordinary prose,
which is the right outcome either way: it describes a real constraint (TS
cannot nest a class) without claiming permanence for surface the comparator
never counted.

The story's other tooling-gap entry, `AbstractAdapter.Version`, was already
gone by audit time.

## Classification changes against the story's pre-audit

The story's pre-audit of the 21 tags PR #5399 migrated holds in full. Three
refinements:

1. `lt` (abstract-adapter.ts:186) carries no tag of its own — it delegates to
   `gte`. The convergence story covers both members regardless.
2. `AbstractAdapter.Version`'s tag was already deleted before this audit; only
   `NullConfig` remained stale.
3. `schemaStatements` was left as "debatable". Decided here: permanent, with
   the reason tightened to state the 76-method scale that makes the `this`-typed
   mixin pattern unworkable.

## Why the convergeable tags are still in the tree

The story's acceptance criteria say a convergeable tag gets deleted so its
surface counts again. That is deliberately **not** done here, on the story's
own instruction: dispositioning 42 tags in one PR would blow the 500-LOC
ceiling, and deleting a tag without doing the work it excuses just moves a
CI failure around. So the audit is the deliverable, each convergence deletes
its own tags as it lands, and the table above is the ledger that says which
story owns which tag.

The single stale tag was the one exception — it had to go because `pnpm api:extra`
was failing on it — and PR #5467 deleted it on main first, so the audit PR ended
up carrying only the two `schemaStatements` reason tightenings and the removal
of the tag-history prose #5467 left behind on `NullConfig`.

## How to keep this honest

`pnpm api:extra` fails on a stale tag — a tag on a name that no longer flags —
which is what caught `NullConfig`. It cannot catch the inverse: a tag on
surface that still flags but should not exist. That is what this audit is for,
and it needs re-running whenever a batch of tags is added at once. The test to
apply is the one at the top of this file, and the precedent to follow is
PR #5367: when in doubt, delete the surface, not the tag.
