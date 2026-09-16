---
title: "Converge composedOf's lazy include onto an Aggregations module + isModuleIncluded"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`composedOf` (`packages/activerecord/src/aggregations.ts`) guards its lazy include with a `Symbol.for("@blazetrails/activerecord:aggregationsIncluded")` marker on the prototype and `prepend(proto, { initializeDup, reload, initInternals })`. Rails is `unless self < Aggregations; include Aggregations; end` (`activerecord/lib/active_record/aggregations.rb:228-230`), with the module at `aggregations.rb:5-24`.

## Acceptance criteria

- Define an `Aggregations` module (ruby-compat `Module`/`defineModule`) carrying `initializeDup`, `reload`, `initInternals` with super-chaining.
- `composedOf` reads `if (!isModuleIncluded(this, Aggregations)) include(this, Aggregations)`; the marker symbol is deleted.
- aggregations tests stay green; no new call/args/extra rows.
