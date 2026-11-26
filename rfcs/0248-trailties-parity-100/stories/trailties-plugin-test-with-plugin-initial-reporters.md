---
title: "trails-plugin.test.ts withPlugin takes initial_reporters"
status: draft
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/minitest/trails-plugin.test.ts` parks "keeps non-default reporters" and
"does not add reporters when not replacing reporters" (`PERMANENT-SKIP`). Rails' `with_plugin`
takes `initial_reporters:` (`vendor/rails/v8.0.5.2/railties/test/minitest/rails_plugin_test.rb:62,68,83-85`)
and seats a `CompositeReporter` of them; trails' `withPlugin` has no such parameter, so the parked
bodies never seat `customReporter` / `[]`.

## Acceptance criteria

- [ ] `withPlugin` takes `initialReporters` in Rails' position, and both parked bodies pass it as Rails does.
