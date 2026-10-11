---
title: "trails db migrate loads the schema into an empty database and reports All migrations are up to date"
status: done
updated: 2026-10-11
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8768
claim: "2026-10-11T01:34:27Z"
assignee: "db-migrate-reports-up-to-date-after-loading-a-schema"
blocked-by: null
closed-reason: null
---

## Context

`trails db migrate` against an EMPTY database loads the whole schema and
reports that it did nothing:

```text
$ HUB_DATABASE_URL=<a database with no tables at all> \
    pnpm exec tsx .../trails.js db migrate
[primary] All migrations are up to date.
[hub] All migrations are up to date.
```

That is the complete output — no `== 20261009000001 CreateOwners: migrating`,
nothing. The database afterwards:

```text
ar_internal_metadata, owners, repositories, repository_collaborators,
repository_settings, schema_migrations, settings
```

It is a SCHEMA LOAD, not a migration run: `ar_internal_metadata` carries a
`schema_sha1` key, which only a schema load writes, and all five versions
appear in `schema_migrations` at once.

The message is computed AFTER the work, from a relation that the work just
emptied:

```ts
// packages/trailties/src/commands/db.ts:498-508
await withPrefixedStdout(currentDbPrefix, () => DatabaseTasks.migrateAll());
for (const { name, raw, hashConfig } of entries) {
  const prefix = multiDb ? `[${name}] ` : "";
  await DatabaseTasks.withTemporaryPool(hashConfig, async (pool) => {
    const adapter = await pool.leaseConnection();
    const migrationContext = migrationContextFor(adapter, migrationsDirsFor.get(name) ?? []);
    const pending = await migrationContext.open().pendingMigrations();
    if (pending.length === 0) console.log(`${prefix}All migrations are up to date.`);
    await dumpSchemaAfterMigrate(raw, hashConfig);
  });
}
```

`pendingMigrations()` is asked once the schema is already in place, so it is
empty whatever happened, and the branch can only ever print "up to date".

Found by trailmap (trailmap#48/#50). The cost was not cosmetic: the
production hub was verified EMPTY, then `db migrate` was run by hand and said
"All migrations are up to date", and the natural reading — "something else
already migrated this, and I do not know what" — sent two people looking for a
deploy hook that does not exist. The `schema_sha1` written by that run matches
the one a scratch database gets from the same command, which is what finally
settled it.

In Rails the two are never confused. `db:migrate` announces every migration it
runs (`== … : migrating` / `migrated`), and loading a schema is a different
task — `db:schema:load`, or `db:prepare`, which says `Created database …` and
loads the schema when there is nothing to migrate.

## Converged shape

`db migrate` reports what it did:

- it ran migrations — name each one, as Rails does;
- it loaded the schema into an empty database — say so, naming the schema file;
- there was genuinely nothing to do — "All migrations are up to date."

The third is the only case that may print today's line, and the decision has to
be made from state captured BEFORE the work, not from `pendingMigrations()`
afterwards.

## Acceptance criteria

- [ ] `db migrate` against a database with no tables prints that it loaded the
      schema, and does NOT print "All migrations are up to date". It prints
      only the latter today.
- [ ] `db migrate` with pending migrations names each one as it runs.
- [ ] `db migrate` with nothing pending still prints "All migrations are up to
      date", and a test distinguishes this case from the first.
- [ ] Each case is covered with more than one configured database, since the
      prefix path (`[primary]` / `[hub]`) is where the message is emitted.
- [ ] The same applies wherever that line is printed — db.ts:302, :506, :551
      and :843.
