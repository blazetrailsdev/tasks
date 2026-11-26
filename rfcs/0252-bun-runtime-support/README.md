---
rfc: "0252-bun-runtime-support"
title: "Run trails apps on the Bun runtime"
status: active
created: 2026-11-19
updated: 2026-11-26
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
| `node:cluster` (RFC 0251)                                                                                          | present               | `fork` present; clustered serving on Bun is a non-goal here          |
| `pg`, `mysql2`                                                                                                     | pure JS               | pure JS; `require` succeeds on Bun 1.3.6 (2026-11-19)                |
| bin shebangs (`trailties/bin/trails.js`)                                                                           | `#!/usr/bin/env node` | `bun trails` works; the shebang still names node                     |

## Design

### Runtime detection

ruby-compat gains `runtime()` returning `"node" | "bun"`, read once from
`process.versions.bun`. Only adapters branch on it. Ported code never does.
That is the same rule the expo adapter follows.

### Module hooks → generation-keyed loading on `Bun.plugin`

zeitwerk registers exactly one hook, a `resolve` hook
(`zeitwerk/lib/core-ext/kernel.ts:34-55`). For files under an autoload root
it appends `?zeitwerk=<generation>` to the URL, so after a reload the next
`import` creates a new module instance. A spike on Bun 1.3.6 (2026-11-19)
found three things:

| Approach                                                                                        | Result                                                                       |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `import(url + "?zeitwerk=N")` with no hook                                                      | same instance for every N (Bun ignores the query)                            |
| `Bun.plugin` `onResolve` returning `path + "?zeitwerk=N"`                                       | `ENOENT` (the query is read as part of the filename)                         |
| `onResolve` into a plugin namespace keyed by generation, plus `onLoad` that reads the real file | new instance per generation, and the same instance for a repeated generation |

So a one-to-one `registerHooks` shim is not possible. Instead,
`ProcessAdapter` gains a narrower member, `registerGenerationalLoader(match,
generationOf)`. On Node it wraps today's `registerHooks` resolve hook,
unchanged. On Bun it is the namespace-plus-`onLoad` approach: `onLoad`
returns the file's source with `loader: "ts"`/`"js"`, and its own relative
imports resolve from the real file's directory. zeitwerk's `kernel.ts` calls
the new member and no longer builds the hook itself. Node behavior and
zeitwerk's tests do not change.

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
the Bun driver, as vitest on the Bun runtime:
`bun --bun node_modules/vitest/vitest.mjs run --project activerecord --project sqlite-drivers sqlite`
from the repo root (the vitest projects are in the root `vitest.config.ts`).
vitest 3.2.4 starts under Bun 1.3.6 this way; the `.bin/vitest` shell shim
does not. The job does not block merges until it has been green for two
weeks.

## Non-goals

- **`bun install` / `bun.lockb` in generated apps.** pnpm stays (root CLAUDE.md).
- **Bun's own test runner (`bun test`).** Tests stay on vitest. The
  activerecord sqlite suite does run on the Bun runtime, as vitest under
  `bun --bun` (§ CI). The rest of the monorepo suite stays on Node.
- **Clustered serving on Bun.** RFC 0251 targets Node's `node:cluster`.
  Running it on Bun is a follow-up once 0251 lands.
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
4. `bun-generated-app-smoke-ci`, `document-bun-cli`
5. `bun-ci-required-check`

## Verification

- With Bun 1.3.x (Open question 2), `bun trails new app && cd app && bun trails db:migrate &&
bun trails test` passes.
- `bun trails server` answers a request, and an edited model reloads in
  development.
- Every activerecord sqlite test (58 files under `test/cases`) that passes
  on better-sqlite3 also passes on `bun-sqlite`, except at most 20
  capability skips, each listed with its receipt in the driver.

## Open questions

1. **Does the Bun CI job gate merges?** Options: (a) required from day one;
   (b) non-blocking, then required after two weeks green; (c) best-effort
   forever. Recommendation: (b). The flip is the named follow-up story
   `bun-ci-required-check`.
2. **What is the minimum Bun version?** Options: 1.2, or 1.3 (the version
   measured here). Recommendation: 1.3. The CI job pins 1.3.x and
   § Verification uses it.
3. **What happens if the namespace loader fails on a real app?** For
   example, source maps, `import.meta.url`, or relative imports might break
   inside the plugin namespace. Options: (a) eager-load everything on Bun,
   which loses development reloading; (b) treat it as a blocker.
   Recommendation: (b). The story goes to `blocked` for an operator ruling,
   and if the ruling picks (a), eager-load is filed then as its own story.
   The spike in § Module hooks makes this less likely, because the core
   mechanism works.

## Changelog

- 2026-11-19: initial RFC
- 2026-11-19: spike shows Bun ignores the `?zeitwerk=` query string, so
  module hooks become a generation-keyed loader; `pg`/`mysql2` load on Bun.
- 2026-11-19: review fixes. Open questions now list options and a
  recommendation; the sqlite pass bar has a number; clustered serving is a
  non-goal; the Bun vitest command is stated; the CLI docs and the
  required-check flip are their own stories.
