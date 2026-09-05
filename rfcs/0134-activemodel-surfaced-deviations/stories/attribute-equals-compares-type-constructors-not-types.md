---
title: "attribute-equals-compares-type-constructors-not-types"
status: claimed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

`Attribute#==` is four `&&`-joined comparisons, the last of which is a plain
value comparison of the types:

```ruby
def ==(other)                                   # activemodel/lib/active_model/attribute.rb:115
  self.class == other.class &&
    name == other.name &&
    value_before_type_cast == other.value_before_type_cast &&
    type == other.type                          # :119
end
alias eql? ==                                   # :121
```

trails' `equals` (`packages/activemodel/src/attribute.ts:189`) instead computes

```ts
const typeEqual =
  this.type === other.type ||
  (this.type != null && other.type != null && this.type.constructor === other.type.constructor);
```

The `constructor` arm is invented: Rails compares the type objects, and
`ActiveModel::Type::Value#==` (`activemodel/lib/active_model/type/value.rb:107-112`)
compares `self.class`, `precision`, `scale` AND `limit`, so two `Type` instances
that differ only in `limit` are equal under trails and unequal under Rails.
The arm exists because `typeRegistry.lookup("string")` hands back a fresh
instance per call, so identity alone would report every equal attribute as
unequal.

The nil-safety of the comparison is settled (trails#7436) and is not the issue
here: `nil == a_type` is false in Ruby, and the first arm already gives that.

## Converged shape

`Type` gets the `==` Rails gives it (`type/value.rb:107-112`) — class, precision,
scale, limit — and `Attribute#equals` compares `this.type` to `other.type`
through it, dropping the `constructor` arm and the null guards it needs. Ruby's
`nil == nil` is true and `nil == a_type` is false, both of which fall out of a
value comparison that admits null.

## Acceptance criteria

- [ ] `Attribute#equals` has one type comparison, mirroring `attribute.rb:119`.
- [ ] Two types differing only in `limit` compare unequal, per `type/value.rb:107-112`.
- [ ] Two separately-looked-up instances of the same registry type still compare
      equal, so `AttributeSet` comparisons do not regress.
- [ ] `pnpm parity:api` deltas non-negative; call and call-arg gates green.
