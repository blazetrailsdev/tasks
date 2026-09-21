---
title: "assertions-tail-schema-cache-rewrite"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`connection_adapters/schema_cache_test.rb`, 33 mismatch lines, was assessed in trails#7876 and not converged. The trails port (`packages/activerecord/src/connection-adapters/schema-cache.test.ts`) is a different test: it builds a `SchemaCache` with `FakePool`/`makeColumn`, dumps JSON with node `fs` temp dirs, and never touches a real pool.

Rails (`schema_cache_test.rb:9-20`) runs every test against `ARUnit2Model.connection_pool` and the canonical `courses` table (3 columns, 1 index), through `BoundSchemaReflection.new(SchemaReflection.new(nil), pool)`, with `assert_no_queries` around loaded caches, YAML/Marshal/gzip dumps (`:38-160, :210-300`), and `assert_raises StatementInvalid` for non-existent tables. Converging needs a rewrite onto ARUnit2Model, the bound reflection API, and decisions on which dump formats trails supports; expect production divergences to surface, park those per RFC 0132.

## Acceptance criteria

The file reports 0 count/kind/value mismatches, using ARUnit2Model and canonical `courses`, not FakePool.
