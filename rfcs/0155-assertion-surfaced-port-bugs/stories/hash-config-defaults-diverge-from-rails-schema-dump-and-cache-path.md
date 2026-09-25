---
title: "hash-config-defaults-diverge-from-rails-schema-dump-and-cache-path"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8073
claim: "2026-09-25T00:44:14Z"
assignee: "datetime-attribute-rejects-ruby-datetime-values"
blocked-by: null
closed-reason: null
---

## Context

Converging hash_config_test.rb (vendor/rails/activerecord/test/cases/database_configurations/hash_config_test.rb:106-108, 139-166) to Rails' expected values fails: Rails' `schema_dump` default is "schema.rb" and `default_schema_cache_path` ends in `schema_cache.yml`; trails' HashConfig (packages/activerecord/src/database-configurations/hash-config.ts) returns "schema.ts" and `schema_cache.json`. Parked as it.skip in hash-config.test.ts (5 tests: default schema dump value, schema cache path default for primary/custom name/different db dir, lazy schema cache path uses default if config is not present). Whether the .ts/.json choice is forced by a language limit was not investigated.

## Acceptance criteria

- Defaults converge on Rails' values or the block is recorded with a specific language reason; parked tests un-skipped.
