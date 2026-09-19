---
title: "store-yaml-dump-load-model-round-trip"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Parked test: `dump, load and dump again a model` in `packages/activerecord/src/store.test.ts`, mirroring `vendor/rails/activerecord/test/cases/store_test.rb:327-335`.

Rails does two `YAML.dump` / `YAML.unsafe_load` round trips of `@john` and asserts `==` after each. trails has no model YAML dump/load surface that this test can call, so the parked body is a placeholder that re-finds by id and does not test serialization. Not investigated further.

## Acceptance criteria

The test round-trips the model through YAML dump/load twice and asserts equality with the original each time, with no `it.skip`.
