---
title: "the production hub database is empty, so every owner and repository page 500s"
status: draft
updated: 2026-10-10
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#48 merged the owner/repository hierarchy onto a second, Postgres
database, and **the production hub is empty**. Checked directly against the
`trailmap-hub` dokku service at merge time:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 0 rows
```

So `/blazetrailsdev`, `/blazetrailsdev/trails` and all eight tabs under it will
fail in production against a database with no `owners` table, even though the
app boots: `config/initializers/hub-database.ts` refuses to start without
`HUB_DATABASE_URL` (which IS set — the service is linked), but nothing asserts
the schema is there, and `GET /up` touches no row. That is the same failure
shape as `deployed-rfcs-index-500s-with-connectionnotdefined`: green
healthcheck, 500 on every page that reads.

The two commands are in `docs/deploy.md` and both must run against the release:

```sh
HUB_DATABASE_URL=<the hub dsn> pnpm db:migrate   # NO --database flag
HUB_DATABASE_URL=<the hub dsn> pnpm db:seed
```

`pnpm db:reset` is NOT an option here and will not be until
`db-drop-connects-to-the-database-it-is-dropping` (RFC 0142) lands —
`trails db drop` connects to the database it is dropping and Postgres refuses
it.

One wrinkle for anyone with a hub database migrated from an intermediate
commit of #48 (local, or a CI cache): the repository name index was changed in
place from per-owner to global, so `schema_migrations` claims the database is
current while the old index is still there. Production is unaffected because
it has never been migrated at all.

## Converged shape

The production hub carries the schema and the seed rows, and the deploy proves
it rather than leaving it to a person to remember.

Migrating on release is the part worth deciding: trailmap already has a
release phase for the task domain, and the hub should go through the same one
rather than being a manual step that is correct once and then forgotten the
next time the hub gains a table.

## Acceptance criteria

- [ ] The production hub has every table in `db/hub_schema.ts` and the seeded
      owner, repositories and collaborator rows.
- [ ] `/blazetrailsdev` and `/blazetrailsdev/trails` answer 200 in production,
      verified against the deployed app and not only locally.
- [ ] The hub's migrations run as part of the deploy, in the same place the
      task domain's do, so a later hub migration does not need this story
      again.
- [ ] The healthcheck or the smoke boot notices a hub with no schema, so the
      green-`/up`-500-everywhere shape cannot recur silently.
