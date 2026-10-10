---
title: "activerecord: attributes_builder reads primary_key before _default_attributes"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8524
claim: "2026-10-10T19:39:39Z"
assignee: "activerecord-prepended-super-first-parameters-onto-super-method"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of trails#8472. Rails' `attributes_builder`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:420-425`):

    def attributes_builder # :nodoc:
      @attributes_builder ||= begin
        defaults = _default_attributes.except(*(column_names - [primary_key]))
        ActiveModel::AttributeSet::Builder.new(attribute_types, defaults)
      end
    end

evaluates `_default_attributes` first (which loads the schema through `columns_hash`,
`model_schema.rb:427-428`), then `column_names`, then `primary_key`.

trails' `attributesBuilder` (`packages/activerecord/src/model-schema.ts:346-357`) hoists
`const primaryKey = this.primaryKey;` above `this._defaultAttributes()`, so the primary key is
read before anything on this path has loaded the schema. Today the answer is the same, because
`getPrimaryKeyAttr` (`attribute-methods/primary-key.ts`) peeks the pool's schema cache rather than
the class's schema memo (covered by "keeps the schema-reflected primary key's default attribute"
in `instantiate-schema-types.trails.test.ts`). It is still a reordering of a Rails body and an
invented local.

## Converged shape

    const defaults = this._defaultAttributes().except(...<column_names - [primary_key]>);

with `_defaultAttributes`, `columnNames`, `primaryKey` evaluated in Rails' order and no hoisted
`primaryKey` local.

## Acceptance criteria

- [ ] `attributesBuilder` evaluates `_defaultAttributes`, then `columnNames`, then `primaryKey`, as `model_schema.rb:422`.
- [ ] `instantiate-schema-types.trails.test.ts` and `primary-keys.test.ts` pass unchanged.
