---
title: "ar init: support --driver node-sqlite"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 5
priority: 18
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2741). Partially addressed since
filed — re-scoped against current code (2026-06-05): `ar init` now **does**
accept `--driver` (parsed at `cli.ts:288-309`, forwarded to `init()`), and the
driver already selects the right package.json peer deps
(`init.ts:66-71` `INIT_DRIVER_DEPS`, applied at `init.ts:259`/`:94` — node-sqlite
maps to `{}`, no `better-sqlite3`).

The remaining gap is the **runtime registration glue**, not the config. Note the
`config/database.ts` adapter is `"sqlite3"` for **both** better-sqlite3 and
node-sqlite (see `new.ts:18-29` `DRIVERS`), so "node:sqlite config" is a misnomer
— the files are identical except for one thing: node-sqlite is a Node built-in
(22.5+) that must be **explicitly registered before** `establishConnection()`.
`ar new` injects that via `DB_GLUE_NODE_SQLITE`
(`new.ts:65` — `import "@blazetrails/activerecord/sqlite/node-sqlite";`) as a
`db.ts` override (`new.ts:156`). `ar init` does **not**: it always writes the
plain `DB_GLUE` (`init.ts:29-45`), which omits the registration import — so a
project `init`ed with `--driver node-sqlite` fails at connect time despite having
correct deps. Low priority — `ar new` covers the new-project case.

## Acceptance criteria

- [ ] `ar init --driver node-sqlite` injects the node-sqlite registration import
      into the scaffolded `db.ts` (parity with `ar new`'s `DB_GLUE_NODE_SQLITE`,
      `new.ts:65`/`:156`) — e.g. via an `overrides["db.ts"]` branch in `init()`
      (`init.ts:233`) when `driver === "node-sqlite"`.
- [ ] Default (no `--driver` / `better-sqlite3`) `db.ts` is unchanged
      (`init.ts:29-45` `DB_GLUE`).

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
