---
title: "better-sqlite3 and expo-sqlite refuse SQLITE_OPEN_SHAREDCACHE where Ruby's sqlite3 gem always honours it"
status: ready
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7644, which closed
`three-sqlite-drivers-silently-drop-the-sharedcache-open-flag`. That story
offered two arms per driver — honour `SQLITE_OPEN_SHAREDCACHE`, or refuse an
open that carries it — and three drivers landed on the refuse arm:

| driver         | probe (pinned version, #7644)                                                                                                                                               | arm taken                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| node:sqlite    | URI-capable                                                                                                                                                                 | honours (`?cache=shared`) |
| libsql local   | URI-capable; no literal file created, two handles see each other's uncommitted rows                                                                                         | honours (`?cache=shared`) |
| better-sqlite3 | **URI-incapable** — probe leaves a literal file named `file::memory:?cache=shared` on disk, so `SQLITE_OPEN_URI` is not set in its build                                    | refuses                   |
| expo-sqlite    | unprobeable outside an Expo/RN runtime; `openDatabaseAsync` takes a database NAME under the app document directory, not a filename SQLite parses, and has no flags argument | refuses                   |
| libsql remote  | a remote URL names a server, so there is no local cache                                                                                                                     | refuses                   |

Refusing is honest — it stops `isSharedCache()`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:472-474`)
reporting a cache the connection does not have — but it is still a divergence.
Ruby has no refusing arm at all: `sqlite3_adapter.rb:33-35` hands the whole
options hash, `:flags` included, to `SQLite3::Database.new`, which honours it,
so a shared-cache config always opens with a shared cache. In trails, the same
config raises `ConfigurationError` on three of five drivers.

`libsql-remote` is arguably not convergeable at all — there is no local cache to
share, which is a property of the transport, not of TypeScript. The other two
are open questions worth actually testing rather than assuming.

## Converged shape

For each of the two local refusing drivers, establish whether the flag can be
honoured after all, and honour it where it can:

- **better-sqlite3** — its `Database` constructor takes `{readonly,
fileMustExist, timeout, verbose, nativeBinding}` and its bundled build does
  not set `SQLITE_OPEN_URI`. Check whether the pinned version exposes any route
  to the open flags (a `nativeBinding` built with URI support, or an option
  added upstream since the probe). If one exists, honour the flag the way
  `sharedCacheDatabase` does for node:sqlite; if not, the refusal is a genuine
  driver limitation and the story closes by recording that with the probe
  command and its output.
- **expo-sqlite** — `openDatabaseAsync(name, options)` forwards `options` to the
  native layer. Establish what that layer accepts and whether a shared-cache
  open is reachable through it, probing inside an Expo/RN runtime rather than
  from Node.

Also fold the duplicate while you are in these files: `sharedCacheDatabase` is
byte-identical in `packages/activerecord/src/sqlite/node-sqlite.ts` and
`packages/activerecord/src/sqlite/libsql.ts` (the libsql copy was ported from
the node:sqlite one in #7644, and the fragment bug fixed in that PR's second
commit had to be fixed twice as a result). Both are module-private today, so
sharing them means a new exported name in `sqlite/sqlite-uri.ts` — which raises
the activerecord `novel` count and needs a `@noRailsEquivalent` receipt, so
weigh that against leaving two copies and decide explicitly rather than by
default.

## Acceptance criteria

- [ ] better-sqlite3 and expo-sqlite each either honour
      `SQLITE_OPEN_SHAREDCACHE` or carry a recorded probe (command + output)
      showing the driver cannot, with the refusal kept as the honest fallback.
- [ ] `isSharedCache()` is still `sqlite3_adapter.rb:472-474` verbatim, with no
      capability guard reintroduced — that guard was deleted by
      `sqlite3-shared-cache-capability-mask-is-a-non-rails-guard` and must not
      come back.
- [ ] The `sharedCacheDatabase` duplication is resolved one way or the other,
      with the extra-surface cost stated.
- [ ] `pnpm parity:api:extra:gate` does not grow.
- [ ] SQLite lanes green, including the shared-cache and URI-fragment tests
      #7644 added to each driver's `*.trails.test.ts`.
