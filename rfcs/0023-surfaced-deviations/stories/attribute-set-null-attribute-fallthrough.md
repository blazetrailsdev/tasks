---
title: "Attribute layer should resolve unknown names via Null attribute instead of bespoke pk==null guards in id/id="
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3624
claim: "2026-06-19T02:36:25Z"
assignee: "attribute-set-null-attribute-fallthrough"
blocked-by: null
---

## Context

PR #3491 (id-getter-null-for-keyless-table) and PR #3428 (cc-id-setter-missing-attribute)
both special-case `primaryKey == null` directly in `getId` / `setId`
(`packages/activerecord/src/attribute-methods/primary-key.ts`): the getter returns
`null` and the setter throws `MissingAttributeError("can't write unknown attribute ``")`.

In Rails these are NOT special-cased. `#id` is simply `_read_attribute(@primary_key)`
and `#id=` is `_write_attribute(@primary_key, value)`
(activerecord/lib/active_record/attribute_methods/primary_key.rb:18-19). With a nil
primary key, `AttributeSet#[]` falls through to `Attribute.null(name)`
(activemodel/lib/active_model/attribute_set.rb:16-18,58-61), which returns `nil` on
read and raises `MissingAttributeError` on write
(activemodel/lib/active_model/attribute.rb:20-22,222-239).

Our attribute layer (`_readAttribute` / `_writeAttribute`) does not gracefully
resolve an unknown/null attribute name to a Null attribute, which is why both
accessors carry bespoke guards. The behavior is correct; the structure diverges.

## Acceptance criteria

- [ ] `_readAttribute(unknownName)` returns `null` and `_writeAttribute(unknownName, v)`
      raises `MissingAttributeError`, via a Null-attribute fallthrough mirroring Rails
      `AttributeSet#[]` → `Attribute.null`.
- [ ] Remove the bespoke `pk == null` guards from `getId` / `setId`, leaving them as
      thin `_readAttribute(pk)` / `_writeAttribute(pk, value)` wrappers matching Rails.
- [ ] No behavior change for keyless tables or real (scalar/composite) primary keys;
      existing primary-keys.test.ts cases still pass.
