---
title: "initialize-time-zone-checks-tzinfo-data-source"
status: draft
updated: 2026-11-06
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Railtie`'s `active_support.initialize_time_zone` (`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb:88-97`) begins with `TZInfo::DataSource.get`, rescuing `TZInfo::DataSourceNotFound` and re-raising it via `e.exception("tzinfo-data is not present. ...")`, then appends `TZInfo` to `config.eager_load_namespaces`. trails' `packages/tzinfo/src/index.ts` has no `DataSource` / `DataSourceNotFound`, so the port in `packages/trailties/src/trailties/active-support.ts` (`active_support.initialize_time_zone`) carries `@missingRailsCall get` / `exception` receipts pointing here.

## Acceptance criteria

- `TZInfo::DataSource.get` and `TZInfo::DataSourceNotFound` are ported in `packages/tzinfo` (tzinfo `lib/tzinfo/data_source.rb`).
- The initializer calls `DataSource.get()` inside the Rails `begin/rescue`, re-raising with Rails' message, and both receipts are deleted.
