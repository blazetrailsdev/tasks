---
title: "Nested-attributes flush path validates unknown keys without alias resolution"
status: in-progress
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4608
claim: "2026-07-05T13:07:26Z"
assignee: "nested-flush-unknown-attribute-alias-resolution"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `model-new-unknown-attribute` (PR #4573). The nested-attributes
**build** path now validates unknown keys via `assertNestedAttributesAreKnown`
(`packages/activerecord/src/nested-attributes.ts`), which resolves aliases by
probing `record.hasAttribute(key)` (→ `resolveAliasName`) before raising
`UnknownAttributeError`.

The pre-existing **flush** path in `processNestedAttributes`
(`nested-attributes.ts:296-326`) validates against a raw `knownAttrs` set built
directly from `targetModel._attributeDefinitions.keys()` + pk/fk/`id`, with NO
alias resolution. So an `alias_attribute`-backed key that has a real writer would
correctly pass on the build path but incorrectly raise on the flush (update)
path — an internal inconsistency and a Rails deviation (Rails routes both through
`assign_attributes` → `_assign_attribute`, which resolves via the writer).

## Acceptance criteria

- [ ] Flush-path unknown-key validation resolves aliases the same way the build
      path does (reuse `assertNestedAttributesAreKnown` or a shared helper).
- [ ] An `alias_attribute`-backed nested key updates an existing record without
      raising on the flush path.
- [ ] No regression to the build-path tests un-skipped in PR #4573.
