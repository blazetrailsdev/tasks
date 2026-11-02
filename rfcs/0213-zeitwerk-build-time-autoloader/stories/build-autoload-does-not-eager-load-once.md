---
title: "Stop the autoload build step eager loading once paths"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
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

`packages/trails-tsc/src/build-autoload.ts` runs initializers up to `setup_main_autoloader`, which includes `setup_once_autoloader` (`packages/trailties/src/application/bootstrap.ts`, mirroring `vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:92-109`) and its awaited `eagerLoad`. RFC 0213 says the build stops before eager load, so an app with `once` paths imports them at build time.

## Acceptance criteria

- `trails build` walks the `once` loader without importing its files.
- A test with a `once` path proves it.
