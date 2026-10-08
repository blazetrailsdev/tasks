---
title: "activerecord depends on @blazetrails/pg as an optional peer, loaded where Rails requires the gem"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: migration
packages: ["activerecord", "pg"]
deps:
  [
    "pg-adapter-constructor-takes-a-pg-connection",
    "pg-connection-escaping-moves-to-the-package",
    "pg-connection-session-setters-move-to-the-package",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/package.json` lists `pg` under `peerDependencies` with
`peerDependenciesMeta.pg.optional: true` (`:71-93`), and `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` imports
`pg` at module scope. Rails loads the gem at the top of the adapter file
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:3-4`), and the adapter file is itself loaded lazily by
`ConnectionAdapters.resolve` (`connection_adapters.rb:22-50`).

Prior art: `lazy-adapter-driver-resolution` (RFC 0100, draft) covers lazy resolution of the
adapter module; this story is only the dependency edge. The `@blazetrails/msgpack` precedent is
`message-pack-loaded-at-call-time-so-msgpack-is-an-optional-peer` (RFC 0184).

## Acceptance criteria

- [ ] `packages/activerecord/package.json`: `@blazetrails/pg` under `peerDependencies` and `peerDependenciesMeta` (optional); the direct `pg` peer is removed. `devDependencies` keeps what the tests need.
- [ ] `grep -rn "from \"pg\"" packages/activerecord/src --include=*.ts` returns only test files.
- [ ] Importing `@blazetrails/activerecord`'s root with neither `pg` nor `@blazetrails/pg` installed does not throw; establishing a `postgresql` connection does, with the message Rails' `LoadError` rescue produces. Verified by a plain-node import of the built `dist/`, not by vitest.
- [ ] Subpath registrations: `packages/activerecord/dx-tests/tsconfig.json` and `virtualized-dx-tests/tsconfig.json` `paths`, the FileStore lock-worker resolve hook; `pnpm test:types` and `pnpm test:types:virtualized` green.
- [ ] `packages/website` builds; if it bundles the PG adapter, the bundle resolves `@blazetrails/pg` and still excludes node-pg.

## Verification

```bash
pnpm test:types && pnpm test:types:virtualized
```
