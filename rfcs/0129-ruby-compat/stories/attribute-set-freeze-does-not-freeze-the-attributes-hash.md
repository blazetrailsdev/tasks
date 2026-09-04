---
title: "AttributeSet#freeze does not freeze the attributes hash; initialize_dup and == are missing"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeSet#freeze` (`vendor/rails/activemodel/lib/active_model/attribute_set.rb:68-71`)
is

```ruby
def freeze
  attributes.freeze
  super
end
```

— it freezes the **attributes hash** and then freezes the set itself. trails'
`freeze` (`packages/activemodel/src/attribute-set.ts:160-163`) only does
`Object.freeze(this)`, so after `set.freeze()` the `_attributes` Record is still
writable: anything holding the hash — `LazyAttributeSet`'s
`defaultAttribute`, which writes `this._attributes[name] = attr` directly, or a
caller that reached it through the protected `attributes()` — can still mutate a
frozen set. The `assertNotFrozen` guard on `set`/`writeFromDatabase`/
`writeCastValue` covers only the methods that check it.

Two neighbours are missing from the same file for the same reason:

- `initialize_dup(_)` (`attribute_set.rb:76-79`) — `@attributes = @attributes.dup`,
  the `dup` twin of the `initialize_clone` trails already has
  (`attribute-set.ts:165-167`).
- `==` (`attribute_set.rb:101-103`) — `other.is_a?(AttributeSet) && attributes ==
other.send(:attributes)`, which has no trails counterpart at all
  (`equals` is absent from the file).

Surfaced while porting `@attributes` to a `Record` in PR #7418; none of the three
is touched by that change.

## Converged shape

`freeze()` freezes `this._attributes` before freezing `this`;
`initializeDup(_other)` sets `this._attributes = dup(this._attributes)` beside
the existing `initializeClone`; `equals(other)` is
`other instanceof AttributeSet && <hash equality> (other as AttributeSet).attributes()`.

## Acceptance criteria

- `freeze()` freezes the attributes hash, so a write through a path that skips
  `assertNotFrozen` throws rather than silently mutating.
- `initializeDup` and `equals` exist with Rails' bodies.
- Covered by tests; `pnpm parity:api` non-negative for activemodel.
