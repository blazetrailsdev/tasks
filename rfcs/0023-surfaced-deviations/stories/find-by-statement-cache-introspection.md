---
title: "find-by-statement-cache-introspection"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
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

Surfaced while converging `core.test.ts` (RFC 0048 one-schema). Rails
`test_find_by_cache_does_not_duplicate_entries`
(`activerecord/test/cases/core_test.rb:246-257`) calls
`Topic.initialize_find_by_cache` and introspects
`@find_by_statement_cache[prepared?]` size, asserting `Topic.find(1)` adds one
statement-cache entry while a subsequent `find_by(id: 1)` adds none.

trails exposes no `initializeFindByCache` / `_findByStatementCache` surface to
introspect, so the test currently can only be a fabricated stub. Either expose
the equivalent cached-find statement cache (per
`activerecord/lib/active_record/core.rb` find-by-cache) or document the
divergence.

## Acceptance criteria

- A trails-observable analog of the find-by statement cache exists (or a
  documented, justified divergence is recorded).
- Un-skip / faithfully port `test_find_by_cache_does_not_duplicate_entries` in
  `core.test.ts`.
