---
title: "Test harness never populates Base.configurations (no :arunit named-config resolution)"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' AR test harness (`ARTest.connect`, `test/support/connection.rb`) sets
`ActiveRecord::Base.configurations` from config.yml, so tests can resolve
named configs (`establish_connection :arunit`,
`connects_to database: { writing: :arunit }`) and Rails'
`QueryCache::ClassMethods#cache` engages via `!configurations.empty?` even on
a not-yet-connected pool (query_cache.rb:10).

The trails harness establishes connections without registering
`Base.configurations` (default `{}` — core.ts:431 host slot; nothing assigns
it at suite setup). PR #5088 had to work around this twice:

- `packages/activerecord/src/query-cache.test.ts` — "cache is available when
  using a not connected connection" manually assigns
  `Base.configurations = { arunit: dbConfig.configuration }` and restores it.
- `packages/activerecord/src/primary-class.test.ts` — both
  "application record shares a connection …" tests pass the current
  `connectionDbConfig()` hash to `connectsTo` because `"arunit"` cannot
  resolve (`resolveConfigForConnection` → `normalizeConfigurations` finds no
  entry).

Converge: have the test harness register ARTest-style named configurations
(`arunit`, `arunit2`) in `Base.configurations` so those tests can drop their
call-site workarounds and pass `"arunit"` like Rails. Related:
0025/converge-test-backend-resolution-onto-rails-config-yml (backend
selection) — this story is the `Base.configurations` population half.

## Acceptance criteria

- [ ] Harness registers `arunit`/`arunit2` named configs in `Base.configurations` at suite setup.
- [ ] query-cache "not connected connection" test drops its manual `Base.configurations` assignment.
- [ ] primary-class connects_to tests pass `"arunit"` instead of a config hash.
