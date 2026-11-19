---
title: "Port the remaining isolated-engine cases of railties engine_test.rb"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10372 ported two of the isolated-engine cases from
`vendor/rails/v8.0.2/railties/test/railties/engine_test.rb`: "do not create table_name_prefix
method if it already exists" (`:1342`) and "take ActiveRecord table_name_prefix into
consideration when defining table_name_prefix" (`:1360`). Both are in
`packages/trailties/test/trailties/engine.test.ts` and boot an app through
`support/isolation/abstract-unit.ts`.

These cases are still unported:

- "isolated engine routes and helpers are isolated to that engine" (`:822`)
- "isolated engine should avoid namespace in names if that's possible" (`:967`), which goes
  through `form_for(Bukkits::Post.new)`
- "isolated engine should set correct route module prefix for nested namespace" (`:1026`)
- "isolated engine can be mounted under multiple static locations" (`:1760`) and
  "... dynamic locations" (`:1803`)

## Acceptance criteria

- Each case is ported under its Rails name in `test/trailties/engine.test.ts`. The namespace
  module is seated on `TopLevel` from the plugin's `lib/<name>.ts`, as in the two ported cases.
- Any port bug a case surfaces is fixed, or filed as its own story.
