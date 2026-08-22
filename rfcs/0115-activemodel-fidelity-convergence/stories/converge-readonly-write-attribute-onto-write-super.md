---
title: "Converge HasReadonlyAttributes#write_attribute onto Write#write_attribute via super"
status: done
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6852
claim: "2026-08-22T01:20:38Z"
assignee: "lint-red-on-main-unnecessary-type-assertion-pg-exec-query"
blocked-by: null
closed-reason: null
---

## Context

`readonly_attributes.rb:49-55` is a two-line guard plus `super`:

```ruby
def write_attribute(attr_name, value)
  if !new_record? && self.class.readonly_attribute?(attr_name.to_s)
    raise ReadonlyAttributeError.new(attr_name)
  end
  super
end
```

`super` reaches `AttributeMethods::Write#write_attribute` (write.rb:31-38),
which does `to_s`, `attribute_aliases[name] || name`, the `"id"` → `@primary_key`
remap, and `@attributes.write_from_user`.

`packages/activerecord/src/readonly-attributes.ts` inlines all of that instead
of calling it: it resolves the alias itself, does the id/composite-PK remap
itself, adds a frozen-record guard Rails does not have in this module, and ends
at `Model.prototype._writeAttribute`. `writeAttribute` in
`packages/activerecord/src/attribute-methods/write.ts` (added by #6846, the
Rails home for `Write#write_attribute`) is therefore exported but unreachable.

It also reorders the guard: Rails checks the RAW `attr_name` and lets `super`
resolve the alias afterwards; trails resolves first, so an aliased write is
caught where Rails would miss it.

## Acceptance criteria

- `readonly-attributes.ts`'s `writeAttribute` is Rails' two-line body plus a
  call to `attribute-methods/write.ts`'s `writeAttribute` in `super`'s place,
  so the Rails method at its Rails home is the one that runs.
- The frozen-record guard and the composite-PK `MissingAttributeError` keep
  working, or their divergence is re-cited where it lands.
- The guard-vs-alias ordering matches readonly_attributes.rb:50, or the
  deviation is cited at the call site with the Rails `file:line`.
- `pnpm vitest run packages/activerecord/src/readonly.test.ts packages/activerecord/src/attribute-methods/write.test.ts` green.
