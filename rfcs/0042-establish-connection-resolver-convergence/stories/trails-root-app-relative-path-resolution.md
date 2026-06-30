---
title: "Introduce Trails.root and resolve ActiveRecord DB/config paths against it (Rails.root parity)"
status: claimed
updated: 2026-06-30
rfc: "0042-establish-connection-resolver-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: "2026-06-30T01:06:03Z"
assignee: "trails-root-app-relative-path-resolution"
blocked-by: null
---

## Context

Introduce a `Trails.root` (the trails equivalent of Rails' `Rails.root`) and have
ActiveRecord's path-resolution sites consume it, replacing their raw-cwd fallback.

Rails references `Rails.root` as an **optional** dependency:
`SQLite3Adapter#initialize` does
`@config[:database] = File.expand_path(@config[:database], Rails.root) if defined?(Rails.root)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:113`).
When an app root is present, relative DB paths resolve against it; otherwise the
path is used as-is.

trails has no equivalent wired into ActiveRecord today, so two sites fall back to
the raw process cwd — a documented deviation:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` —
  `prepareDatabasePath()` resolves the DB path with `path.resolve(getFs().cwd(), filename)`
  (the deviation note lives in that method's JSDoc; added in PR #4296 /
  story `sqlite-db-path-expansion-mkdir`).
- `packages/activerecord/src/connection-handling.ts:968` — `loadConfigFile()`
  resolves `config/database.{ts,js,json}` against `process.cwd()` directly.

Meanwhile **trailties already models an app root**:
`packages/trailties/src/application.ts:64` (`Application.findRoot` →
`findRootWithFlag("config.ts", from, cwd)`) and `requireRoot()`
(`application.ts:174`, falls back to `getFsAsync().cwd()`). So the root concept
exists one layer up; ActiveRecord just doesn't have a seam to read it.

The faithful design mirrors Rails' `defined?(Rails.root)` seam: an injectable
`Trails.root` (settable by trailties' boot, unset in bare ActiveRecord usage)
that the ActiveRecord path sites read when present and fall back to cwd otherwise.
This removes the cwd deviation and unifies DB-path + database.yml resolution.

## Acceptance criteria

- [ ] A `Trails.root` accessor (injectable, optional) exists and is reachable from
      ActiveRecord without a hard `trailties` dependency (mirror Rails' optional
      `defined?(Rails.root)` seam — e.g. a registry/global on activesupport that
      trailties' `Application` sets on boot).
- [ ] `sqlite3-adapter.ts` `prepareDatabasePath()` expands relative to
      `Trails.root` when set, else cwd; drop/replace the cwd deviation note.
- [ ] `connection-handling.ts` `loadConfigFile()` resolves `config/database.*`
      against `Trails.root` when set, else cwd; remove the direct `process.cwd()`
      reference (repo rule: no `process.*`).
- [ ] trailties' `Application` boot sets `Trails.root` from its resolved
      `requireRoot()` so end-to-end app usage matches Rails.
- [ ] Tests: relative DB path + relative `config/database.*` resolve against an
      injected root; bare ActiveRecord (no root set) still falls back to cwd.

## Notes

- No `node:*` imports, no `process.*` in activerecord/activesupport runtime paths
  (use the fs adapter's `cwd()`).
- Homed in RFC 0042 (single DatabaseConfig funnel): app-root path resolution is
  part of the same config-resolution convergence — `config/database.*` loading in
  `connection-handling.ts` is exactly the funnel 0042 owns. Surfaced from sibling
  story `sqlite-db-path-expansion-mkdir` (RFC 0010, PR #4296).
