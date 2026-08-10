---
title: "converge-attribute-names-list-instance-accessor"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5920
claim: "2026-08-02T20:37:26Z"
assignee: "converge-attribute-names-list-instance-accessor"
blocked-by: null
closed-reason: null
---

## Context

Classified by `extra-surface-base-accessors-classify` as a category (c)
rename-to-converge.

`packages/activerecord/src/base.ts:4176` declares an instance getter
`attributeNamesList`, delegating to `attributeNamesList` in
`packages/activerecord/src/attribute-methods.ts` (which is itself flagged as
1 novel extra in `pnpm parity:api:extra --package activerecord --novel-only`).

Rails names this `attribute_names`, an instance method at
`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:334`. The
class-method of the same name is at attribute_methods.rb:236 and is already
ported as `Base.attributeNames()` (base.ts, just below the getter). The `List`
suffix looks like it was added to dodge a collision that does not exist: in TS
a `static attributeNames()` and an instance `attributeNames` occupy different
slots.

Verified: `grep -rn "def attribute_names_list" vendor/rails` returns nothing.

Callers of the instance form:
`packages/activerecord/src/associations/collection-proxy.ts:1044, :1055`.

## Acceptance criteria

- Rename the instance accessor to `attributeNames` in
  `attribute-methods.ts` and in the `base.ts` declaration, keeping the existing
  `static attributeNames()` intact and unshadowed.
- Update the two `collection-proxy.ts` call sites.
- Confirm no subclass/instance/static resolution regression (a getter and a
  static of the same name).
- `base.ts` and `attribute-methods.ts` each drop one novel extra; record
  before/after in the PR body.
- NO test renames. Re-run `pnpm parity:api:calls`.
