---
title: "Use canonical Pirate/Bird models in nested-attributes-with-callbacks tests"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/nested-attributes-with-callbacks.test.ts` declares bespoke `NwcBird` / `NwcPirate` models over the `birds` / `pirates` tables and re-declares their associations inline. Rails' `activerecord/test/cases/nested_attributes_with_callbacks_test.rb` uses the canonical `Pirate` and `Bird` (`vendor/rails/activerecord/test/models/pirate.rb`, `bird.rb`), including the `birds_with_add` / `birds_with_add_load` has_many associations with `before_add` callbacks. The assertion counts already match (PR #7867), but the fixtures do not.

## Acceptance criteria

- The file uses `Pirate` / `Bird` from `test-helpers/models/` and `fixtures({ ... })`; no `Nwc*` classes and no inline `hasMany` / `acceptsNestedAttributesFor` calls.
- Any association Rails' `pirate.rb` declares that the trails `Pirate` model lacks is added to the model, not the test.
- Test names, and the 0 assertion mismatches, are unchanged.
