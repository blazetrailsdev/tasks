---
title: "trails db seed loads no initializers, so a second database has no connection and the command never exits"
status: draft
updated: 2026-10-10
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48), the first application here with two
databases. The workaround is live in `db/seeds.ts` on `main` and should be
deleted when this lands.

`trails db seed` imports the seed file and nothing else — no application boot,
so no `config/initializers/*` have run:

```ts
// packages/trailties/src/commands/db.ts:347 (runSeed)
const url = pathToFileURL(seedFile);
url.searchParams.set("_t", `${++_seedImportCounter}`);
await import(url.href);
```

A seed file therefore runs with only whatever connection the command itself
established — the PRIMARY one. Any model on a second database has no pool, so
every query in the seeds either falls through to the primary (and fails on
"no such table: owners") or raises `ConnectionNotDefined`.

trailmap's hub models live on an abstract `Hub` base whose connection is
established by `config/initializers/hub-database.ts`. Because that initializer
never runs under `db seed`, the seed file has to re-do the initializer's whole
job by hand, and then undo it:

```ts
// db/seeds.ts — trailmap, the workaround this story removes
// `trails db seed` runs this file against the PRIMARY pool and loads no
// initializers, so `config/initializers/hub-database.ts` has not run and
// `Hub` has no connection — every query below would fall through to the
// SQLite primary and fail on "no such table: owners". Establish it here.
await Hub.establishConnection(hubDatabaseConfig());
await loadHubSchemas();

// ... the actual seeds ...

// Hand the hub pool back. `trails db seed` knows only about the primary
// connection, so the one established above keeps its sockets — and the
// process — alive after the seeds finish, and the command never exits.
await Hub.removeConnection();
```

That last part is the sharp edge: without `removeConnection`, `trails db seed`
hangs forever once a Postgres pool is open, because nothing in the command
knows the pool exists to close it. A seed file that simply uses a second
database — the obvious thing to write — makes the command never exit.

In Rails none of this arises. `db:seed` depends on `:load_config` and
`:environment`, so the application is booted, every initializer has run, and
every `establish_connection` is in place before `db/seeds.rb` is loaded. The
seed file is about seeds.

## Converged shape

`db seed` loads the application environment before importing the seed file, as
Rails' `:environment` prerequisite does — initializers run, every configured
connection is established, and the command disconnects what it established
when the seeds finish, so the process exits.

If booting the full environment is too much for this command, the narrower
version is still correct: establish every configured database's connection,
not just the primary, and disconnect them all at the end.

## Acceptance criteria

- [ ] A seed file that queries a model on a non-primary database succeeds under
      `trails db seed` with no `establishConnection` of its own. It fails today
      with `ConnectionNotDefined` or a primary-database "no such table".
- [ ] `trails db seed` EXITS after seeding a Postgres database, with no
      `removeConnection` in the seed file. It hangs today.
- [ ] Initializers have run by the time the seed file is imported, pinned by a
      test whose seed file reads something an initializer sets.
- [ ] The same applies to the paths that call `runSeed` indirectly —
      `db setup` and `db reset` (db.ts:726, :767, :860, :872).
- [ ] trailmap's `db/seeds.ts` drops its `Hub.establishConnection` /
      `loadHubSchemas` / `Hub.removeConnection` scaffolding and still seeds.
