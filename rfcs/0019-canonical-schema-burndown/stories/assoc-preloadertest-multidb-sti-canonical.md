---
title: "assoc-preloadertest-multidb-sti-canonical"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T20:27:35Z"
assignee: "assoc-preloadertest-multidb-sti-canonical"
blocked-by: null
---

## Context

Follow-up wave of `associations-test-preloadertest-canonical` (RFC 0019).
The `PreloaderTest` describe in
`packages/activerecord/src/associations.test.ts` still defines inline bespoke
models for:

- `multi database polymorphic preload with same table name` (Mdp\* models —
  two `dogs` tables across primary + secondary connections; Rails uses
  `Dog` + `OtherDog < ARUnit2Model`)
- `preload with available records sti` (Sti\* models — `books`/`essays` with an
  STI `essay` has_one; Rails uses canonical `Book`/`Essay`)

Convert to canonical models where the canonical schema/connection helpers
allow. The multi-database test routes a second `dogs` through a real pooled
connection — keep that behaviour but back it with canonical `Dog`/`Comment`
and the canonical `dogs` shape.

- trails: `packages/activerecord/src/associations.test.ts` (`PreloaderTest`)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`PreloaderTest`)

## Acceptance criteria

- [ ] Convert the multi-database polymorphic and STI available-records tests
      onto canonical models.
- [ ] Test names match Rails verbatim. test:compare delta non-negative.
- [ ] PR <=500 LOC. No node:_/process._; async fs only.
