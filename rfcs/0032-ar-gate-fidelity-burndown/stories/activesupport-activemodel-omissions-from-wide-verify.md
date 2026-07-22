---
title: "activesupport-activemodel-omissions-from-wide-verify"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
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

Omissions found by per-entry wide-call verification, activesupport/activemodel/
trailties cluster — each verified against the vendored source:

- `ActiveModel::Dirty#as_json` (activemodel dirty.rb:264-268) excludes the
  mutation-tracker ivars and defers to the model serializer via super; trails
  activemodel dirty.ts:111-113 returns `this.changes` — a different contract.
- `ActiveSupport::Duration#initialize` (duration.rb:226-234) rejects zero parts
  and computes `@variable` from VARIABLE_PARTS; trails duration.ts:54-65 has no
  variable-duration tracking (affects Time arithmetic parity).
- `Cache::Store#namespace_key` (cache.rb:948-968) supports per-call :namespace
  overrides and callable namespaces; trails cache/entry-record.ts:19-21 takes a
  pre-resolved string only.
- `Engine::Configuration#all_eager_load_paths` (railties
  engine/configuration.rb:133-135) unions `paths.eager_load`; trails
  engine/configuration.ts:99-101 returns eagerLoadPaths only.

## Acceptance criteria

- Each gap either converged on the Rails body or split into its own scoped
  story with a written rationale; wide-exclude reasons updated to match.
