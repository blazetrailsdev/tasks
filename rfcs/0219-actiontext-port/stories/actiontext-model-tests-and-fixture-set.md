---
title: "Port ActionText::FixtureSet and the model, strict-loading and table-name tests"
status: claimed
updated: 2026-11-13
rfc: "0219-actiontext-port"
cluster: at-models
packages: ["actiontext"]
deps: ["actiontext-record-rich-text-and-attribute"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: "2026-11-13T19:49:48Z"
assignee: "actiontext-encryption"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text/fixture_set.rb` (68): `FixtureSet.attachment` over
  `ActiveRecord::FixtureSet.signed_global_id` with
  `for: ActionText::Attachable::LOCATOR_NAME` (`:61-66`); trails has
  `signedGlobalId` in `packages/globalid/src/fixture-set.ts`.
- Tests: `test/unit/model_test.rb` (19), `strict_loading_test.rb` (3),
  `test/models/table_name_test.rb` (1), `test/unit/fixture_set_test.rb` (1).

## Acceptance criteria

- `FixtureSet.attachment` returns the same `<action-text-attachment sgid=…>`
  string, through the ported `signedGlobalId`.
- The 24 tests pass on all three adapters.
- `table_name_test.rb`'s `table_name_prefix` arm runs against
  `ActionText::Record`'s abstract class as Rails does.
