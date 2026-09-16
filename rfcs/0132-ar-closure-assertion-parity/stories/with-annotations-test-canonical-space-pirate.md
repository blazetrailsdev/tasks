---
title: "WithAnnotationsTest: use canonical SpacePirate instead of bespoke SpacePirateAnnotated"
status: draft
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations.test.ts` `WithAnnotationsTest` declares a bespoke
`SpacePirateAnnotated` model inline (table `pirates`) instead of using the canonical
`SpacePirate` from `packages/activerecord/src/test-helpers/models/pirate.ts:206`.
Rails' test uses `SpacePirate` from `vendor/rails/activerecord/test/models/pirate.rb:105`
(`parrot_with_annotation`, `parrots_with_annotation`, `ship_with_annotation`,
`birds_with_annotation`, `treasure_estimates_with_annotation`), exercised at
`vendor/rails/activerecord/test/cases/associations_test.rb:1603-1702`.

Surfaced while converging assertions in trails#7841 (assertions now match; the model does not).

## Acceptance criteria

- The canonical `SpacePirate` declares every `*_with_annotation` association in pirate.rb:105+ with Rails' scopes/options.
- `WithAnnotationsTest` uses the canonical `SpacePirate`; the inline `SpacePirateAnnotated` class is deleted.
- `associations_test.rb` stays at 0 assertion mismatches.
