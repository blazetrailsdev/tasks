---
title: "Base.typeForAttribute returns ValueType, never null (attribute_types default)"
status: ready
updated: 2026-10-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::AttributeRegistration::ClassMethods#type_for_attribute`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb:43-51`)
answers `attribute_types[attribute_name]`. In ActiveRecord, `attribute_types` is a Hash
whose default is `Type.default_value` (`model_schema.rb`, `load_schema!` / `attribute_types`),
so the read never returns nil.

trails' `Base.typeForAttribute` (`packages/activerecord/src/base.ts`, `static typeForAttribute`)
is typed `ValueType | null`. Every caller that relies on Rails' non-nil answer therefore needs
a `!`. One example is `_createRecord` in `packages/activerecord/src/persistence.ts`
(`this.typeForAttribute(column)!.deserialize(value)`), added in trails#9080.

## Acceptance criteria

- [ ] Confirm `attributeTypes()` carries the `Type.default_value` default so that `hashAref` never answers null, and converge it if it does not.
- [ ] Type the no-block arm's return as `ValueType` (the block arm stays `fetch`), and remove the now-unnecessary `!` / null checks at the call sites.
- [ ] `pnpm typecheck` green; no runtime change beyond the default convergence.

## Audit 2026-10-22

`static typeForAttribute(name, block?): ValueType | null` is at `base.ts:588`.
