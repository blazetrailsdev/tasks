---
title: "trails db --database <name> loads the primary's schema dump into it"
status: draft
updated: 2026-10-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48), which is the first application to configure a
second database: a SQLite `primary` for the task domain and a PostgreSQL `hub`
for its owner/repository hierarchy.

`trails db <verb> --database <name>` narrows the registered database
configurations to the one targeted:

```ts
// packages/trailties/src/commands/db.ts:227
async function withRegisteredConfiguration<T>(config: HashConfig, fn: () => Promise<T>) {
  return withRegisteredConfigurations([config], config.envName, fn);
}
```

`DatabaseConfigurations#isPrimary` answers "is it the first registered config?"
for any name that is not literally `primary`:

```ts
isPrimary(name) {
  if (name === "primary") return true;
  const firstConfig = this.findDbConfig(this.defaultEnv());
  return !!firstConfig && name === firstConfig.name;
}
```

With one config registered, that is always true — so the targeted database
becomes primary for every `isPrimary` question inside the command. The one that
does damage is in `initializeDatabase`, which loads the schema dump into a
database with no `schema_migrations` yet:

```ts
const schemaDumpPath = DatabaseTasks.schemaDumpPath(dbConfig); // → db/schema.ts
if (schemaDumpPath != null && File.isExist(schemaDumpPath)) {
  await DatabaseTasks.loadSchema(dbConfig, schemaFormat(), undefined);
}
```

**Observed**, on an empty Postgres `hub`:

```sh
trails db migrate --database hub
```

created the entire SQLite task-domain schema inside it — `stories`, `rfcs`,
`events`, `story_deps`, `story_packages`, `story_paths`, `story_rfc_deps` —
with `schema_migrations` holding only `20260910000007`, the dump's version,
and then ran the hub's own four migrations on top.

The command also disagrees with itself: `dumpSchemaAfterMigrate` runs OUTSIDE
that registration (`db.ts:350`), where `isPrimary("hub")` is false, so it
correctly writes `db/hub_schema.ts`. One invocation loads `db/schema.ts` and
dumps `db/hub_schema.ts`.

Rails has no equivalent failure: `db:migrate:<name>` keeps every configuration
registered and targets one of them.

trailmap carries no workaround. Nothing in it passes `--database`; the
unflagged `trails db migrate` registers both configurations and is correct, and
that is what its CI, its README and `docs/deploy.md` tell you to run.

## Converged shape

Register the environment's FULL configuration set and target one of them, so
`isPrimary` keeps answering about the real primary:

```ts
async function withRegisteredConfiguration<T>(config: HashConfig, fn: () => Promise<T>) {
  const all = await allConfigsForEnv(config.envName);
  return withRegisteredConfigurations(all, config.envName, fn);
}
```

`forEachDatabase` already loads every entry to filter it (`taskableDatabaseEntries`),
so the full set is in hand at the call site.

## Acceptance criteria

- [ ] `trails db migrate --database <non-primary>` against an EMPTY database
      creates only that database's own migrations' tables, and
      `schema_migrations` holds only its own versions.
- [ ] A test in trailties with a two-database config (a primary with a schema
      dump on disk, and a second database) that fails on the current code:
      the primary's tables must not appear in the second database.
- [ ] `isPrimary` is false for the non-primary name everywhere inside the
      command — assert the schema LOAD path and the schema DUMP path agree,
      since today they disagree with each other.
- [ ] `db create`, `db drop`, `db schema:dump` and `db seed` with `--database`
      are checked for the same narrowing.
