---
title: "enum macro default:/scopes:/instance_methods: options"
status: claimed
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 46
pr: null
claim: "2026-07-07T16:01:48Z"
assignee: "enum-macro-default-scopes-instance-methods-options"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `enum.test.ts` to the canonical `Book` model (RFC 0050,
PR #4410 enum-canonical-book-gaps). The macro-level `enum()` options
`default:`, `scopes: false`, and `instance_methods: false` are not wired into
trails' `enum()` (`packages/activerecord/src/enum.ts` `_enum`). (The sibling
`validate:` option is tracked separately under `enum-validate-option`.)
Skipped cases in `packages/activerecord/src/enum.test.ts`: "overloaded default
by :default", "scopes can be disabled by :scopes", "default methods can be
disabled by :instance_methods".

## Acceptance criteria

- [ ] `enum(name, mapping, { default })` seeds the attribute default.
- [ ] `scopes: false` suppresses per-value scope generation; `instance_methods:
false` suppresses predicate/bang generation — matching Rails.
- [ ] Un-skip the three `enum.test.ts` cases (drop `it.skip` → `it`).
