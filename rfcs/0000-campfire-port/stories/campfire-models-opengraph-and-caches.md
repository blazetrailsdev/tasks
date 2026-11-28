---
title: "Campfire example: Opengraph, ResponseCache, RecordCache, FragmentCache and FirstRun models with their tests"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, activerecord]
deps: [campfire-app-skeleton, campfire-lib-rails-ext-and-restricted-http]
deps-rfc: []
est-loc: 1100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/models/opengraph/` (264 lines),
`response_cache.rb` (98), `record_cache.rb`, `fragment_cache.rb`,
`first_run.rb`; tests `opengraph/`, `record_cache_test.rb`,
`response_cache_test.rb`, `first_run_test.rb` (about 650 lines). `Opengraph::Fetch` and `Opengraph::Location` call `RestrictedHTTP`, ported in
`campfire-lib-rails-ext-and-restricted-http`, which brings in Surfguard.

## Acceptance criteria

- [ ] each listed model ported file for file
- [ ] each listed test file ported and passing

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
