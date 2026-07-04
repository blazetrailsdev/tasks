---
title: "sanitize-mass-assignment-permitted-getter"
status: ready
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced in review of PR #4529 (assign-attributes-each-pair-duck-typing).

`sanitizeForMassAssignment` (activemodel/src/attribute-assignment.ts:81) gates the
ForbiddenAttributesProtection unwrap on `typeof attrs.permitted === "function"`.
But the real trails `ActionController::Parameters.permitted`
(actionpack/src/action-controller/metal/strong-parameters.ts:113) is a boolean
GETTER, not a method — so `typeof` on it is `"boolean"`, never `"function"`.

Consequence: passing a real (unpermitted) `Parameters` object to mass-assignment
does NOT raise `ForbiddenAttributesError` and is NOT unwrapped via `toH`; the raw
Parameters object flows straight into `_assignAttributes`. This defeats
ForbiddenAttributesProtection for the exact class it mirrors
(ActiveModel::ForbiddenAttributesProtection#sanitize_for_mass_assignment,
which raises unless `permitted?`).

Pre-existing (not introduced by #4529). The identical assumption also appears in
`isHashLike` but is harmless there because `toH` admits real Parameters anyway.

## Acceptance criteria

- [ ] `sanitizeForMassAssignment` detects `permitted` whether it is a boolean
      getter (real Parameters) or a method (duck-typed wrappers) — e.g. read
      the value via `"permitted" in attrs` and coerce, rather than `typeof ... === "function"`.
- [ ] An unpermitted real `Parameters` passed to `assignAttributes`/`update`
      raises `ForbiddenAttributesError`.
- [ ] A permitted `Parameters` is unwrapped via `toH` and assigns normally.
- [ ] Test covers both permitted and unpermitted real `Parameters`.
