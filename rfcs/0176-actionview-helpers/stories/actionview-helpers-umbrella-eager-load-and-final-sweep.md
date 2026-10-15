---
title: "Helpers umbrella: eager_load! and the 0-missing helper sweep"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
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

With the register entry removed, `helpers.rb` (the `ActionView::Helpers` umbrella) counts 87 missing. All but one are the included modules' gaps owned by the sibling stories; the umbrella's own `eager_load!` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers.rb`) is unported.

## Acceptance criteria

- [ ] `Helpers.eager_load!` ported in `packages/actionview/src/helpers.ts`.
- [ ] Final sweep: after the sibling helper stories land, `pnpm parity:api --package actionview --files` shows 0 missing on `helpers.rb` and every `helpers/**` row; anything left gets a story.
