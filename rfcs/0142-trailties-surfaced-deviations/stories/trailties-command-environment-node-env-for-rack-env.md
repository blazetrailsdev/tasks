---
title: "trailties: Command.environment reads NODE_ENV in Rails' RACK_ENV slot"
status: draft
updated: 2026-11-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: [trailties]
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

`Rails::Command.environment` is `ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence || "development"` (`vendor/rails/v8.0.5.2/railties/lib/rails/command.rb:51-53`). trails reads `NODE_ENV` in the `RACK_ENV` slot: `packages/trailties/lib/command.ts:61`, `lib/database.ts:5`, `lib/info.ts:82`, `lib/server/boot.ts:21`. Under vitest `NODE_ENV=test`, so a Rails test that deletes `RACK_ENV` (`railties/test/application/rake/multi_dbs_test.rb:1043-1059`) must delete `NODE_ENV` instead (trails#10809).

## Acceptance criteria

- [ ] Operator decides whether `NODE_ENV` is trails' spelling of `RACK_ENV` (ratify in `packages/trailties/CLAUDE.md`) or the reads converge on `RACK_ENV`.
- [ ] Every site above follows that decision.
