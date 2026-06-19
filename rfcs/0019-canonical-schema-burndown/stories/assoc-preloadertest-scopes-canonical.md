---
title: "assoc-preloadertest-scopes-canonical"
status: ready
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up wave of `associations-test-preloadertest-canonical` (RFC 0019).
Wave-1 (PR converting the simple "available records" belongs_to/has_many family)
moved the trivial tests onto canonical `Post`/`Author`/`Comment`. The
`PreloaderTest` describe in `packages/activerecord/src/associations.test.ts`
still defines inline bespoke models for the scoped/coalescing-grouping tests:

- `preload with instance dependent scope` (PIDS\* models)
- `preload with instance dependent through scope` (PWITS\* models)
- `preload groups queries with same scope at second level` (GSL\* models)
- `preload groups queries with same sql at second level` (GSE\* models)
- `preload with grouping sets inverse association` (IA\* models)
- `preload does not group same class different scope` (DC\* models)
- `preload does not group same scope different key name` (DKN\* models)

These define ad-hoc `belongs_to`/`has_many`/through associations with custom
scopes on the canonical `authors`/`posts`/`comments`/`author_favorites`/
`postesques` tables. Convert to canonical models — preferring real canonical
associations where they exist (`Author#postsMentioningAuthor`,
`Author#commentsOnPostsMentioningAuthor`, `Author#authorFavorites`,
`Postesque#author`) and adding any missing scoped associations to the official
models rather than inline.

- trails: `packages/activerecord/src/associations.test.ts` (`PreloaderTest`)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`PreloaderTest`)

## Acceptance criteria

- [ ] Convert the seven scoped/grouping tests above onto canonical models.
- [ ] Test names match Rails verbatim. test:compare delta non-negative.
- [ ] PR <=500 LOC. No node:_/process._; async fs only.
