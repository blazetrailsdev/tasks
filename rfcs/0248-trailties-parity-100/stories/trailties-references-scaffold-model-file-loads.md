---
title: "trailties-references-scaffold-model-file-loads"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-24T17:07:12Z"
assignee: "query-logs-pet-connection-in-request"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/application/rake.test.ts` "scaffold with references columns tests
pass by default" (Rails `vendor/rails/v8.0.5.2/railties/test/application/rake_test.rb:246-257`)
runs `bin/trails generate scaffold LineItems product:references cart:belongs_to`, then
`db:migrate` aborts with
`LoadError: cannot load such file -- <app>/app/models/line_item.ts`. The generator writes
the model under a different (kebab-case) file name than the one the loader then requires,
or the loader computes a snake_case path for the plural-CamelCase input. The test is parked
`it.skip` under `BLOCKED:` this story.

## Acceptance criteria

- [ ] `generate scaffold LineItems product:references cart:belongs_to` followed by `db:migrate` boots cleanly.
- [ ] `bin/trails test` reports `7 runs, 0 failures, 0 errors`, and the `BLOCKED:` skip is removed.
