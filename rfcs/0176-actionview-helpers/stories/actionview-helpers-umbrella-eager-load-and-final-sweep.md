---
title: "Helpers umbrella: eager_load! and the 0-missing helper sweep"
status: done
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps:
  - actionview-unported-register-drops-helper-entries
  - port-form-helper-file-field-check-box-radio-button
  - port-form-tag-helper-field-tag-methods
  - form-helper-button-and-default-form-builder
  - port-form-options-helper-and-select-tag
  - port-collection-grouped-time-zone-weekday-select-tags
  - port-collection-check-boxes-and-radio-buttons-tags
  - port-date-helper-date-time-selector
  - port-date-select-tags-and-time-tag
  - port-translation-helper
  - controller-helper-delegators-visible-to-parity
  - port-atom-feed-helper
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9037
claim: "2026-10-18T18:14:53Z"
assignee: "actionview-helpers-umbrella-eager-load-and-final-sweep"
blocked-by: null
closed-reason: null
---

## Context

With the register entry removed, `helpers.rb` (the `ActionView::Helpers` umbrella) counts 87 missing. All but one are the included modules' gaps owned by the sibling stories; the umbrella's own `eager_load!` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers.rb`) is unported.

## Acceptance criteria

- [ ] `Helpers.eager_load!` ported in `packages/actionview/src/helpers.ts`.
- [ ] Final sweep: after the sibling helper stories land, `pnpm parity:api --package actionview --files` shows 0 missing on `helpers.rb` and every `helpers/**` row; anything left gets a story.
