---
title: "HasReadonlyAttributes#write_attribute carries a frozen guard and a raise flag Rails does not"
status: ready
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `HasReadonlyAttributes#write_attribute` carries two guards Rails does not

## Context

`readonly_attributes.rb:49-55` is exactly a readonly check plus `super`:

```ruby
def write_attribute(attr_name, value)
  if !new_record? && self.class.readonly_attribute?(attr_name.to_s)
    raise ReadonlyAttributeError.new(attr_name)
  end

  super
end
```

PR #6852 converged the body onto that shape — the alias resolution and the
`"id"` → primary-key remap moved to `attribute-methods/write.ts` where write.rb
writes them, and the guard now checks the RAW `attr_name` as readonly_attributes.rb:50
does. Two trails-only guards survive in
`packages/activerecord/src/readonly-attributes.ts:109-126` and are documented
there rather than converged:

1. **The frozen-record guard.** `if (this._attributes.isFrozen()) throw new Error(...)`
   opens the method. Rails has no such check in this module; a frozen Ruby
   record raises `FrozenError` from the attribute set itself. The message
   (`Cannot modify a frozen X`) is trails'.
2. **`_readonlyAttributesRaise`.** Rails only `include`s `HasReadonlyAttributes`
   when `raise_on_assign_to_attr_readonly` was true at `attr_readonly`
   declaration time (`readonly_attributes.rb:33`), so the guard is ABSENT
   otherwise. trails always installs the method and gates it on a per-class
   flag captured in `attrReadonly` (readonly-attributes.ts:57-59), which stands
   in for the conditional include.

`_writeAttribute` (readonly-attributes.ts:133-148) carries the same
`_readonlyAttributesRaise` conjunct, mirroring `readonly_attributes.rb:57-62`.

## Converged shape

For (1): find where a frozen record raises in trails' attribute set and let the
raise come from there, as it does in Ruby, so `write_attribute` is the Rails
two-liner. Check the error class and message a frozen trails record should
produce — Ruby raises `FrozenError`, and the current `Error` with a bespoke
message is a third deviation riding along.

For (2): the faithful shape is a conditional mixin — install
`HasReadonlyAttributes`' `write_attribute` / `_write_attribute` onto the class
only when `raise_on_assign_to_attr_readonly` is true at declaration time, which
is what `include` does in Ruby. trails has the machinery (`include()` from
activesupport is idempotent and one-way, which is exactly the property
readonly-attributes.ts's comment already relies on). That removes the flag and
both conjuncts.

## Acceptance criteria

- [ ] `writeAttribute` in `readonly-attributes.ts` is readonly_attributes.rb:49-55
      and nothing else: the readonly check, then the call into
      `attribute-methods/write.ts`'s `writeAttribute`.
- [ ] The frozen-record raise happens where Ruby's does, with Ruby's error class.
- [ ] `_readonlyAttributesRaise` is gone, replaced by installing the module
      conditionally the way readonly_attributes.rb:33 does — or, if that is
      genuinely blocked, the blocker is named with a `pnpm tasks block`.
- [ ] `pnpm vitest run packages/activerecord/src/readonly.test.ts packages/activerecord/src/attribute-methods/write.test.ts` green.
