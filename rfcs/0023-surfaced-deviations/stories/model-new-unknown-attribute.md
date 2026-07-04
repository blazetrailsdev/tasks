---
title: "model-new-unknown-attribute"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-04T21:47:05Z"
assignee: "model-new-unknown-attribute"
blocked-by: null
---

## Context

Surfaced by `converge-nested-attributes-test-one-schema`. Two cases are skipped
(tracked-pending-convergence) in `packages/activerecord/src/nested-attributes.test.ts`:
"should raise an UnknownAttributeError for non existing nested attributes" and its
has_many counterpart.

Building a nested record from a hash with an unknown key does NOT raise
UnknownAttributeError because trails' `Model.new` / association `build` silently
drops unknown attributes. trails DOES raise on the update-existing flush path,
but Rails raises on the build path too. Root cause is base-level
(`Model.new(unknownKey: ...)` should raise), not nested-attributes-specific.

## Acceptance criteria

- [ ] `Model.new` / build raises UnknownAttributeError for unknown attribute keys
      (excluding nested control keys `_destroy`/pk/fk on the nested path).
- [ ] Un-skip both nested-attributes unknown-attribute cases.
