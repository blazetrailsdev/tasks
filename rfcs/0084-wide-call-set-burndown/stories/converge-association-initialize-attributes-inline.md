---
title: "converge-association-initialize-attributes-inline"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6381
claim: "2026-08-11T22:06:06Z"
assignee: "converge-association-initialize-attributes-inline"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burndown-associations` (RFC 0084) after the post-0083 re-measure.

`Association#initialize_attributes` (vendor/rails/activerecord/lib/active_record/associations/association.rb:217-225)
is nine lines, inline:

```ruby
except_from_scope_attributes ||= {}
skip_assign = [reflection.foreign_key, reflection.type].compact
assigned_keys = record.changed_attribute_names_to_save
assigned_keys += except_from_scope_attributes.keys.map(&:to_s)
attributes = scope_for_create.except!(*(assigned_keys - skip_assign))
record.send(:_assign_attributes, attributes) if attributes.any?
set_inverse_instance(record)
```

trails delegates the whole body to two invented module-level helpers:
`applyScopeForCreate` and `filterScopeForCreate`
(`packages/activerecord/src/associations/association.ts:1063` and `:1120`),
called from `initializeAttributes` (`association.ts:643`). `filterScopeForCreate`
is also called by `CollectionProxy#_applyScopeForCreate`
(`packages/activerecord/src/associations/collection-proxy.ts:1411`), so the
helper cannot simply be inlined without also converging that call site.

This is the abstraction-Rails-does-not-have class: two exported names with no
Ruby counterpart standing in for one Rails method body. It also carries the
`initialize_attributes → map` wide-ratchet row.

## Acceptance criteria

1. `Association#initializeAttributes` carries the Rails body inline, with the
   Rails locals (`exceptFromScopeAttributes`, `skipAssign`, `assignedKeys`,
   `attributes`).
2. `applyScopeForCreate` and `filterScopeForCreate` are deleted, or the
   CollectionProxy call sites are converged onto whatever Rails method they
   actually mirror first.
3. `pnpm parity:api:extra --package activerecord` loses the corresponding
   novel names; the `initialize_attributes` wide row is retired from
   `call-mismatches-exclude/activerecord/associations/association.json` by hand.
4. Verified against `vendor/rails/activerecord/test/cases/associations/`
   (has_many / has_one / belongs_to build + create paths).
