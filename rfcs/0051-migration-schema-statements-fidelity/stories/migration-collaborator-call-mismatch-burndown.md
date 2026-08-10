---
title: "Burn down the 7 call-mismatch entries on InternalMetadata/SchemaMigration once they hold a pool"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: ["migration-collaborator-call-sites-pass-a-pool"]
deps-rfc: []
est-loc: 200
pr: 6265
claim: "2026-08-09T01:30:48Z"
assignee: "port-sqlite-rake-create-drop-charset-collation-tests"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls activerecord` carries **7 baselined call-mismatch entries**
across the two migration collaborators — 6 in
`call-mismatches-exclude/activerecord/internal-metadata.json` and 1 in
`.../schema-migration.json`. They are not independent: they are three root
causes, and two of the three are only fixable once the collaborators hold a
pool, which `migration-collaborators-hold-a-pool-and-reach-connections-through-it`
(landed, PR #6239) and `migration-collaborator-call-sites-pass-a-pool` deliver.

This story burns all 7 down.

### Root cause 1 — `tableExists` hand-rolls a probe where Rails reads the schema cache

Baseline entries: `internal-metadata.ts` `table_exists?` is missing **both**
`schema_cache` and `data_source_exists?`.

Rails (`internal_metadata.rb:104-106`) is one line off the pool, with no query
at all:

```ruby
def table_exists?
  @pool.schema_cache.data_source_exists?(table_name)
end
```

trails (`internal-metadata.ts`) issues a `SELECT 1 … LIMIT 1` inside a bare
`try { … } catch { return false }`.

**This is the exact code behind the `check-current-protected-environment`
failure.** The blanket `catch` is what turned the adapter proxy's
Promise-instead-of-SQL (`TypeError: Expected first argument to be a string`)
into a silent `false`, which surfaced as `NoEnvironmentInSchemaError` across 11
tests. Converging to the pool's schema cache deletes the swallow-all `catch`
along with the divergence — a probe that cannot fail silently.

Note `SchemaMigration#table_exists?` (`schema_migration.rb:100-104`) takes the
_other_ Rails route — `@pool.with_connection { |c| c.data_source_exists?(name) }`
— so the two are not the same fix. Port each to its own Rails shape rather than
unifying them.

**The existing JSDoc deviation note must be answered, not deleted silently.** It
currently reads: "Reads the table directly (SELECT 1) rather than consulting the
schema cache, so the result is fresh after recent DDL." That is a real concern —
these are migration collaborators, so DDL is precisely what runs next door. Rails
accepts schema-cache staleness here. Verify the trails suite agrees before
committing to it: `SchemaCache#dataSourceExists`
(`connection-adapters/schema-cache.ts:262`) populates from `dataSources` on first
miss, and `ConnectionPool` exposes a bound reflection
(`_boundSchemaCache = new BoundSchemaReflection(this.schemaReflection, this)`).
If a test genuinely needs post-DDL freshness, the Rails-faithful answer is a
schema-cache clear at the DDL site, not a bespoke probe here.

### Root cause 2 — `execute` where Rails uses `select_values` / `select_all`, so `.first` never appears

Baseline entries: `count -> first` in **both** files, and
`select_entry -> first` in `internal-metadata.ts`.

Rails ends each of these with `.first` on a typed select helper:

```ruby
# internal_metadata.rb:63-70 and schema_migration.rb:91-98
connection.select_values(sm, "#{self.class} Count").first
# internal_metadata.rb:164-172
connection.select_all(sm, "#{self.class} Load").first
```

trails calls the generic `connection.execute(connection.toSql(sm))` and indexes
the raw rows — `Number(rows[0]?.cnt ?? 0)`, `rows[0] ?? null`. Two consequences
beyond the missing `.first`:

- trails adds an `.as("cnt")` alias to the COUNT projection that Rails has no
  analogue for; `selectValues` makes it unnecessary.
- **The query name is lost.** Rails passes `"InternalMetadata Count"` /
  `"SchemaMigration Count"` / `"InternalMetadata Load"` as the `name` argument.
  Those names are what mark a query for SCHEMA-tagged filtering, which this RFC
  has repeatedly had to care about (`view-exists-probe-must-be-schema-named`,
  `schema-statements-reflection-probes.trails.test.ts`). Restore the names.

`selectValues` and `selectAll` already exist on the adapter
(`connection-adapters/abstract/database-statements.ts:1682` and `:1622`), so
this is a straight substitution.

### Root cause 3 — ORDER-only divergence in `create_entry` / `update_entry`

Baseline entries: `create_entry -> order:currentTime,constructor` and
`update_entry -> order:currentTime,constructor` (RFC 0084 seeding — the port
makes every call Rails makes, in a different sequence).

Rails builds the Arel manager **first**, then calls `current_time` inline in the
value list — and in `create_entry` calls it **twice**, once for `created_at` and
once for `updated_at` (`internal_metadata.rb:130-140`):

```ruby
im = Arel::InsertManager.new(arel_table)
im.insert [
  [arel_table[primary_key], key],
  [arel_table[value_key], value],
  [arel_table[:created_at], current_time(connection)],
  [arel_table[:updated_at], current_time(connection)]
]
```

trails hoists a single `currentTime(...)` above the manager and reuses it.
Reorder to match. Keep the two separate `currentTime` calls in `create_entry`:
that is what the recorded call sequence expects, and collapsing them is the
divergence.

## Acceptance criteria

- [ ] `InternalMetadata#tableExists` reads
      `@pool.schema_cache.data_source_exists?(table_name)`
      (`internal_metadata.rb:104-106`); the `SELECT 1` probe and its blanket
      `catch` are gone.
- [ ] `SchemaMigration#tableExists` uses
      `@pool.with_connection { |c| c.data_source_exists?(table_name) }`
      (`schema_migration.rb:100-104`), also without a swallow-all `catch`.
- [ ] The "reads the table directly … so the result is fresh after recent DDL"
      JSDoc note is resolved — either deleted because the concern does not hold,
      or replaced by a schema-cache clear at the DDL site with a comment saying
      which test demanded it.
- [ ] `count` (both files) uses `selectValues(…, "<Class> Count").first`;
      `selectEntry` uses `selectAll(…, "<Class> Load").first`. The `.as("cnt")`
      alias is gone and the Rails query names are passed.
- [ ] `createEntry` / `updateEntry` build the Arel manager before calling
      `currentTime`, and `createEntry` calls `currentTime` twice as
      `internal_metadata.rb:130-140` does.
- [ ] All 7 entries are removed from
      `call-mismatches-exclude/activerecord/internal-metadata.json` and
      `.../schema-migration.json`; `pnpm parity:api:calls activerecord` is only-shrink.
- [ ] Full suite green with no test renames.

## Out of scope

`InternalMetadata#tableExists` also carries an `if (!this.enabled) return false`
guard that Rails' `table_exists?` does not have. Leave it — the `enabled`
semantics are
`internal-metadata-takes-a-pool-nullpool-arm-reads-enabled`'s subject, and
touching both at once would tangle two burndowns.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, single PR from main.
