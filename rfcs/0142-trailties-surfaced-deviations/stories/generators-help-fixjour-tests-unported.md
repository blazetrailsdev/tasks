---
title: "Port Rails' Fixjour generators-help tests"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Behavior.lookup!` globs the whole lookup tree (`vendor/rails/v8.0.2/railties/lib/rails/command/behavior.rb:56-65`). trails#10347 converged `lookupBang` in `packages/trailties/lib/generators.ts` to match. `generate --help` is covered only indirectly, through `publicNamespaces`.

Rails has two tests in `vendor/rails/v8.0.2/railties/test/generators_test.rb` that are not ported:

- `test_rails_generators_with_others_information`
- `test_rails_generators_does_not_show_active_record_hooks`

They need the Fixjour fixture generators (`railties/test/fixtures/lib/generators/`) registered under their Ruby constant names.

## Acceptance criteria

- The Fixjour fixture generators exist under `packages/trailties/test/fixtures/lib/generators/`.
- Both tests are ported into `packages/trailties/test/generators.test.ts` under their Rails names.
