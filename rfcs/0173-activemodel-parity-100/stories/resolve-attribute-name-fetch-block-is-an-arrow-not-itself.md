---
title: "activemodel: resolve_attribute_name's &:itself block is an inline identity arrow"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
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

`ActiveModel::AttributeMethods::ClassMethods#resolve_attribute_name`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:396-398`) is

```ruby
attribute_aliases.fetch(super, &:itself)
```

`packages/activemodel/src/attribute-methods.ts` spells the block
`block((key) => key)`: an arrow naming a parameter where Rails passes
`Kernel#itself` (`rb_obj_itself`, `vendor/ruby/v3.3.11/object.c:614`) as the block.
ruby-compat has no `itself`. The reviewer of trails PR 8409 raised it on each
of three passes; it predates that PR (trails PR 8324).

## Acceptance criteria

- [ ] ruby-compat exports `Kernel#itself`, receipted `@noRailsEquivalent PERMANENT` and cited to `object.c:614`, only if a second `&:itself` call site in the repo also takes it (the package's rule 1: only what trails calls).
- [ ] `resolveAttributeName` and every other `&:itself` port pass it instead of an inline identity arrow.
