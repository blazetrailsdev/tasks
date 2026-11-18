---
title: "A bundled app pulls only its configured adapter's driver, not every loadPath target"
status: ready
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ConnectionAdapters.loadPath`'s literal `import()` map (activerecord, see
packages/activerecord/CLAUDE.md § "An adapter file is loaded by an awaited step") makes every built-in
adapter, and so `mysql2`, `pg`, `better-sqlite3`, `iconv-lite` and `aws-ssl-profiles`, reachable from
every app's module graph. In the serverless spike an esbuild bundle of a SQLite app grew by about
1.2 MB (about 80 ms of cold start). Marking the unused drivers external did not work either: esbuild
hoists an external import to the top of an ESM bundle, so the drivers became load-time
dependencies. The spike's `examples/serverless-lambda/bundle.mjs` replaces them with a stub plugin.
mysql2/yaml also use a CJS `require("process")`, which needs a `createRequire` banner in an ESM bundle.

## Acceptance criteria

- A bundled app includes only the driver for its configured adapter, with no bundler-side
  stub plugin.
- The `ConnectionAdapters.load` / `resolve` semantics and error messages are unchanged.
- Measure the bundle size and cold start of the spike app before and after.
