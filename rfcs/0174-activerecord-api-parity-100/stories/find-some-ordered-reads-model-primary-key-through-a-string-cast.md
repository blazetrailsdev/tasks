---
title: "activerecord: find_some_ordered reads model.primaryKey into a local and stringifies it for type_for_attribute"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

Left by trails#8759. Rails' `find_some_ordered`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:567-580`) casts
each id with `model.type_for_attribute(primary_key).cast(id)` and relates with
`relation.where(primary_key => ids)`, reading the relation's `primary_key`.

The port (`packages/activerecord/src/relation/finder-methods.ts`, `findSomeOrdered`) reads
`this.model.primaryKey` into a local `pk` Rails does not have, and calls
`typeForAttribute(String(pk))`. For a composite key `String(pk)` is `"shop_id,id"`, where Ruby's
`attr_name.to_s` on the Array gives `["shop_id", "id"]`. Both miss every attribute and answer the
default type, so behaviour agrees today, by accident of the miss.

## Acceptance criteria

- [ ] `findSomeOrdered` passes `this.primaryKey` to `where`, `table[...]` and `typeForAttribute`
      with no `pk` local and no `String(...)`.
- [ ] `typeForAttribute` accepts what `primary_key` answers, as `type_for_attribute`
      (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:481-490`) does through
      `attr_name.to_s`.
- [ ] The three "find with a multiple sets of composite primary key" tests in `finder.test.ts` pass.
