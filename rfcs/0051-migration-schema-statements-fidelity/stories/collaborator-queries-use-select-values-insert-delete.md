---
title: "SchemaMigration/InternalMetadata send execute(toSql(...)) where Rails sends insert/delete/select_values with a query name"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6249
claim: "2026-08-08T17:27:58Z"
assignee: "collaborator-queries-use-select-values-insert-delete"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `SchemaMigration` / `InternalMetadata` onto a pool in
PR #6239. The bodies now reach a connection through `withConnection` the way
Rails does, but what they then _call_ on it is still a trails invention: every
query goes out as `connection.execute(connection.toSql(manager))`.

Rails hands the Arel manager to a typed statement method, with a query name:

```ruby
# schema_migration.rb:19-25
def create_version(version)
  im = Arel::InsertManager.new(arel_table)
  im.insert(arel_table[primary_key] => version)
  @pool.with_connection do |connection|
    connection.insert(im, "#{self.class} Create", primary_key, version)
  end
end

# schema_migration.rb:27-33
connection.delete(dm, "#{self.class} Destroy")

# schema_migration.rb:77-85 / :91-98
connection.select_values(sm, "#{self.class} Load")
connection.select_values(sm, "#{self.class} Count").first

# internal_metadata.rb:58-62 / :64-71
connection.delete(dm, "#{self.class} Destroy")
connection.select_values(sm, "#{self.class} Count").first
```

Three things are lost by going through `execute(toSql(...))`:

1. **The query name.** `"SchemaMigration Load"` / `"InternalMetadata Count"` is
   what shows up in the log and in `assertQueries`-style instrumentation;
   trails emits unnamed SQL, which also inflates named-query assertions
   elsewhere.
2. **The projection.** `select_values` returns a flat column array; trails gets
   rows back and re-projects by hand (`rows.map((row) => String(row[...]))`,
   `Number(rows[0]?.cnt ?? 0)`), which is where the `first` and
   `order:currentTime,constructor` call-mismatch baseline rows come from.
3. **`insert`'s return.** Rails' `connection.insert(im, name, primary_key,
version)` answers the supplied id; trails discards the result and returns
   `version` from a hand-written `return`.

The remaining `call-mismatches-exclude` rows for both files
(`schema-migration.json`, `internal-metadata.json` — `first`, `select_values`,
`insert`, `delete`, `order:currentTime,constructor`) are exactly this cluster.

## Converged shape

Each body calls the statement method Rails calls, with Rails' name string:

```ts
async versions(): Promise<string[]> {
  const sm = new SelectManager(this.arelTable);
  sm.project(this.arelTable.get(this.primaryKey));
  sm.order(this.arelTable.get(this.primaryKey).asc());
  return await this._withConnection((connection) =>
    connection.selectValues(sm, "SchemaMigration Load"),
  );
}
```

Check what `selectValues` / `insert` / `delete` accept in trails first — they may
need to take an Arel manager rather than a SQL string, which is its own small
convergence and should be sized into this story.

## Acceptance criteria

- [ ] `SchemaMigration` `createVersion` / `deleteVersion` / `versions` / `count`
      call `insert` / `delete` / `selectValues` with Rails' name strings
      (`schema_migration.rb:19-98`).
- [ ] `InternalMetadata` `deleteAllEntries` / `count` / `selectEntry` /
      `createEntry` / `updateEntry` likewise (`internal_metadata.rb:58-71`,
      `:132-160`).
- [ ] The hand-rolled row re-projection is gone; `select_values` supplies the
      flat array.
- [ ] The `first` / `select_values` / `insert` / `delete` call-mismatch baseline
      rows for both files are deleted, not rewritten.
