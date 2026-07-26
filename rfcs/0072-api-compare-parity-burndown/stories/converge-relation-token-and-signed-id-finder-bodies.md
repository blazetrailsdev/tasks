---
title: "converge-relation-token-and-signed-id-finder-bodies"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. 14 entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`
covering the token-for and signed-id finders that
`ActiveRecord::TokenFor::RelationMethods` and `SignedId::RelationMethods` mix
into Relation.

Anchors: `vendor/rails/activerecord/lib/active_record/token_for.rb` and
`.../signed_id.rb`.

- `find_by_token_for` drops `fetch`, `find_by`, `model`, `new`, `primary_key`,
  `resolve_token`, `token_definitions`.
- `find_by_token_for!` drops `fetch`, `find`, `model`, `resolve_token`,
  `token_definitions`.
- `find_signed` / `find_signed!` drop `model`.

Read the Rails bodies first: `find_by_token_for` looks the purpose up in
`token_definitions.fetch(purpose)` (raising KeyError on an unknown purpose),
resolves the token, then dispatches through `find_by(primary_key => id)`. The
dropped `fetch` is the unknown-purpose raise; the dropped `model` is the
Relation → model-class hop that the trails port appears to shortcut.

## Acceptance criteria

- Converge the four bodies onto Rails' structure: `tokenDefinitions` lookup that
  raises on an unknown purpose, `resolveToken`, then `findBy` / `find` on the
  model's primary key.
- Add a regression test for the unknown-purpose raise that fails on the current
  implementation.
- Entries drop out of `call-mismatches-wide-exclude/activerecord/relation.json`;
  `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after
  `vendor/rails/activerecord/test/cases/tokens/token_for_test.rb` and
  `.../signed_id_test.rb`.
