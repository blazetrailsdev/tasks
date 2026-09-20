---
title: "assertions-reflection-primary-keys-multiparameter-remainder"
status: claimed
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-09-20T22:41:50Z"
assignee: "assertions-reflection-primary-keys-multiparameter-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-reflection-primary-keys-multiparameter (RFC 0132). This PR converged five multiparameter tests (date, time [parked], time with old date, ignore hour if blank, time with utc). Re-measure with `pnpm parity:test -- --package activerecord --assertions --missing` and grep `reflection_test.rb`, `primary_keys_test.rb`, `multiparameter_attributes_test.rb`.

Still open: all of reflection_test.rb (~80 rows), primary_keys_test.rb (~43), and the remaining multiparameter tests (time no date / invalid params / missing date parts must `assert_raise MultiparameterAssignmentErrors` and check `ex.errors[0].attribute`; aggregation tests; tz-aware tests). Use `Topic.find(1)` (fixtures) as Rails does. Note trails Time `toEqual` vs `Time.local` fails (see multiparameter-time-local-not-equal-to-time-local); `toFs` imports from `@blazetrails/activesupport`.

## Acceptance criteria

- The three files report 0 assertion count/kind/value mismatches; failures caused by production bugs parked `it.skip` with `BLOCKED:` and a story in 0155.
