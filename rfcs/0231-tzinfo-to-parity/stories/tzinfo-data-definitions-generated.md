---
title: "Vendor tzinfo-data and generate its definition modules, so RubyDataSource is the default on every platform"
status: ready
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-ruby-data-source"
deps-rfc: []
est-loc: 450
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DataSource.create_default_data_source` (`vendor/tzinfo/v2.0.6/lib/tzinfo/data_source.rb`)
prefers `RubyDataSource` when the tzinfo-data gem loads, and falls back to
`ZoneinfoDataSource`, which needs a host `zoneinfo` directory. That directory is
missing on Windows, minimal CI images and in browsers. So before the Intl
stand-in is retired, tzinfo-data must load everywhere. tzinfo-data is not
vendored. Its `lib/tzinfo/data/definitions/**.rb` files are generated Ruby that
calls the Format2 definers, so the same generator that
`tzinfo-ruby-data-source` writes for the test fixtures can emit them.

## Acceptance criteria

- [ ] tzinfo-data is vendored through trails' `vendor/sources.ts` (data only:
      `compareApi` / `compareTests` off, with the reason recorded).
- [ ] The build generates TS definition modules from it, published with
      `@blazetrails/tzinfo` (or a `tzinfo-data` package if size requires); the
      generated output is a build artifact, not checked in.
- [ ] `DataSource.get` with no source set answers a `RubyDataSource` in a
      cold-node test with no `zoneinfo` directory on the search path.
