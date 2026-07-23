---
title: "base-test-divergent-model-data-fidelity"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

10 assertion-VALUE mismatches in `base.test.ts` vs
`vendor/rails/activerecord/test/cases/base_test.rb`. Pattern: trails ported
several tests against invented models/tables instead of Rails' — "table name
based on model name" asserts "users" (Rails: "posts"), "set table name with
inheritance" asserts "custom_parents" (Rails: "foosks"), "table name with 2
abstract subclasses" asserts "concretes" (Rails: "photos"), "columns should
obey set primary key" asserts "uuid" (Rails: "nick" via Subscriber). Also
weakened/divergent data: "unicode column name" (Rails asserts the round-tripped
"たこ焼き仮面"; trails asserts true), "bignum" (Rails 2147483648; trails
Number.MAX_SAFE_INTEGER — verify which value the canonical schema/type supports
and mirror Rails), "typecasting aliases" (10 vs 3), "ignored columns are not
present in columns_hash" (first_name vs secret — bespoke model?), "when ignored
attribute is loaded, cast type should be preferred over DB type" ("Developer:
name" vs true), "initialize with invalid attribute" (asserts error-class name
instead of Rails' errors count + attribute name). Per the canonical-models
rule, converge each to Rails' models (`vendor/rails/activerecord/test/models/`)
and exact values.

## Acceptance criteria

- Listed tests use Rails' models/columns/data and assert Rails' values.
- `--assertions` shows 0 value-mismatches for base_test.rb.
