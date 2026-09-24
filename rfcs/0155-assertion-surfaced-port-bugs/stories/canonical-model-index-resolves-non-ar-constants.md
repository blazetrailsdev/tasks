---
title: "Canonical model index resolves non-AR constants for klass resolution"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8046
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: null
closed-reason: null
---

## Context

`reflection_test.rb:171-185` (`test_reflection_klass_requires_ar_subclass`)
expects `ArgumentError` because `AccountInvalid` / `InfoInvalid` are real
(non-AR) top-level constants (`vendor/rails/activerecord/test/models/user_with_invalid_relation.rb`),
so `compute_class` resolves them and `reflection.rb` raises "not an
ActiveRecord::Base subclass". trails' canonical model index
(`packages/activerecord/src/support/canonical-model-index.ts:7-17`) indexes
only `Base` subclasses, so those constants resolve as missing (`NameError`).
PR trails#7933 works around it by `modelRegistry.set`-ing them inside the test.

## Acceptance criteria

- Constant resolution for canonical test models resolves non-AR exported
  classes too (Ruby constant lookup), so the `klass` guard reaches its
  `ArgumentError` arm without per-test registration.
- Drop the `modelRegistry.set` / `onTestFinished` workaround from
  `reflection.test.ts` "reflection klass requires ar subclass".
