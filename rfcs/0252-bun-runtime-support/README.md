---
rfc: "0252-bun-runtime-support"
title: "Run trails apps on the Bun runtime"
status: draft
created: 2026-11-19
updated: 2026-11-19
owner: "@deanmarano"
packages:
  - "ruby-compat"
  - "zeitwerk"
  - "activerecord"
  - "trailties"
clusters:
  - runtime
  - sqlite
  - ci
---

# RFC 0252 — Run trails apps on the Bun runtime

## Summary

Make a generated trails app boot, serve, migrate and pass its tests under
`bun` as well as Node, without forking any package. Node (`engines.node >=26`)
stays the primary runtime and the only one we release against. Bun is a second
supported runtime. We reach it through seams trails already has: the
`ProcessAdapter` in ruby-compat and the `SqliteDriver` in activerecord. The
package manager stays pnpm (root CLAUDE.md § Hotwire installs). This RFC is
about the runtime, not `bun install`. **Post-launch.**

## Motivation

- Bun starts faster than Node, and `trails` boot cost is already tracked
  (`docs/trailties/boot-cost-and-bundle-findings.md`).
- Users ask whether a TS-native Rails runs on Bun. Today it fails at autoload.
- The work is small, because trails routes most runtime access through two
  adapters already.

## What breaks today (measured on Bun 1.3.6)

| Surface                                                                                                            | Node                  | Bun 1.3.6                                                            |
| ------------------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------------------- |
| `module.registerHooks` (`ruby-compat/lib/process-adapter.ts:961`, used by `zeitwerk/lib/core-ext/kernel.ts:30-35`) | present               | `undefined`, so zeitwerk raises `NotImplementedError` and boot fails |
| `better-sqlite3` (default SQLite driver, `activerecord/lib/sqlite/better-sqlite3.ts`)                              | native addon          | not supported (V8 addon ABI)                                         |
| `node:sqlite` (`activerecord/lib/sqlite/node-sqlite.ts`)                                                           | present               | not present; Bun ships `bun:sqlite`                                  |
| `node:http` (`rackup/lib/handler/node.ts:63`)                                                                      | present               | present, compatible                                                  |
| `node:async_hooks` `AsyncLocalStorage`                                                                             | present               | present                                                              |
| `node:cluster` (RFC 0251)                                                                                          | present               | `fork` present; behavior to verify                                   |
| `pg`, `mysql2`                                                                                                     | pure JS               | pure JS, expected to work                                            |
| bin shebangs (`trailties/bin/trails.js`)                                                                           | `#!/usr/bin/env node` | `bun trails` works; the shebang still names node                     |

## Design

### Runtime detection

ruby-compat gains `runtime()` returning `"node" | "bun"`, read once from
`process.versions.bun`. Only adapters branch on it. Ported code never does.
That is the same rule the expo adapter follows.

### Module hooks → `Bun.plugin`

A `BunProcessAdapter` implements `registerHooks` on `Bun.plugin`, using
`onResolve`/`onLoad`. It covers only the hook shapes zeitwerk registers. If a
shape has no Bun equivalent, it raises the same `NotImplementedError` it
raises today, and that shape is listed under § Non-goals.

### SQLite → `bun:sqlite` driver

`activerecord/lib/sqlite/bun-sqlite.ts` implements `SqliteDriver`, the same way
`libsql.ts` and `expo-sqlite.ts` do, plus a `bun-sqlite-adapter` export. When
the adapter is `sqlite3` and the runtime is Bun, the sqlite3 adapter resolves
to this driver, so `config/database.yml` does not change. Wherever
`bun:sqlite`'s capabilities differ from better-sqlite3's, `capabilities()`
reports that; the driver does not fake the missing ones.

### CLI

`bun trails …` and `bunx trails …` are documented. The shebang stays `node`.

### CI

There is one Bun job. It runs a generated-app smoke (`new`, `db:migrate`,
`server` plus one request, and `test`) and the activerecord sqlite suite on
the Bun driver. The job does not block merges until it has been green for two
weeks.

## Non-goals

- **`bun install` / `bun.lockb` in generated apps.** pnpm stays (root CLAUDE.md).
- **Running the trails monorepo's own vitest suite under `bun test`.**
- **Deno.** It has a separate compat layer. Doing Bun first tells us how much
  of the adapter work carries over.
- **`Bun.SQL` drivers for Postgres/MySQL.** `pg` and `mysql2` are pure JS
  and run on Bun as they are. Native `Bun.SQL` drivers would be a speed
  option for later, behind the same adapter seam, and are not needed for
  support.
- **`Bun.serve` as a rackup handler.** It could be a later handler. For now
  `node:http` works.

## Alternatives considered

- **Require `better-sqlite3` and wait for Bun addon support.** Rejected: it has
  no date, and it would block the default database.
- **Make `node:sqlite` the only driver on both runtimes.** Rejected: Bun does
  not ship it.
- **Drop zeitwerk's hooks on Bun and eager-load everything.** This is the
  fallback if `Bun.plugin` cannot cover zeitwerk's shapes. It changes
  development reloading, so it needs an operator ruling.

## Rollout

1. `runtime-detection-and-bun-process-adapter`
2. `zeitwerk-hooks-via-bun-plugin`
3. `bun-sqlite-driver`
4. `bun-generated-app-smoke-ci`

## Verification

- With Bun 1.3.x, `bun trails new app && cd app && bun trails db:migrate &&
bun trails test` passes.
- `bun trails server` answers a request, and an edited model reloads in
  development.
- The activerecord sqlite suite passes on `bun-sqlite`, apart from tests that
  are skipped by capability with a receipt.

## Open questions

1. Is Bun a supported runtime with a CI gate, or best-effort with a
   non-blocking job? (The draft says non-blocking first, then gating.)
2. What is the minimum Bun version? (The draft says 1.3.)
3. If `Bun.plugin` cannot express a zeitwerk hook, do we accept eager-load on
   Bun?
