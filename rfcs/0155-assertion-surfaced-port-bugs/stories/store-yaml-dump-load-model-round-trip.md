---
title: "store-yaml-dump-load-model-round-trip"
status: blocked
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-25T15:11:37Z"
assignee: "schema-dumper-cases-dump-a-hand-built-schema-source"
blocked-by: "needs psych-object-protocol-for-record-yaml-round-trip: YAML.dump/unsafe_load of a record is Psych's !ruby/object + encode_with/init_with protocol (core.rb:498-502,587-591), which trails lacks entirely (activesupport/yaml is bare npm parse/stringify; yaml_serialization_test.rb is PERMANENT-SKIP for the same gap; sibling relation-to-yaml-psych-dump hits it too)"
closed-reason: null
---

## Context

Parked test: `dump, load and dump again a model` in `packages/activerecord/src/store.test.ts`, mirroring `vendor/rails/activerecord/test/cases/store_test.rb:327-335`.

Rails does two `YAML.dump` / `YAML.unsafe_load` round trips of `@john` and asserts `==` after each. trails has no model YAML dump/load surface that this test can call, so the parked body is a placeholder that re-finds by id and does not test serialization. Not investigated further.

## Acceptance criteria

The test round-trips the model through YAML dump/load twice and asserts equality with the original each time, with no `it.skip`.
