---
title: "F-9g2 follow-up — lazy attribute-method generation (define_attribute_methods)"
status: ready
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR #3155 review). Rails asserts
attribute accessor methods are ABSENT before `define_attribute_methods` and
present afterward (`activerecord/test/cases/attribute_methods/read_test.rb:45-63`),
backed by `ActiveRecord::AttributeMethods#define_attribute_methods` /
`attribute_methods_generated?` (`activerecord/lib/active_record/attribute_methods.rb:98-143`).
Trails currently generates accessors eagerly at `attribute()` declaration time
(attribute-methods.ts) — there is no lazy generation gate. Matching Rails'
lazy generation is a portable parity gap, not a JS-runtime impossibility.

Skipped matched tests in `packages/activerecord/src/attribute-methods/read.test.ts`:

- "define attribute methods"
- "attribute methods generated?"

## Acceptance criteria

- [ ] Lazy attribute-method generation (`defineAttributeMethods` /
      `attributeMethodsGenerated?`) wired so accessors are absent until
      generation runs; both tests un-skipped and passing. ≤500 LOC.
