---
title: "Issue AttributeMethods::Dirty's 'cannot include Dirty after Timestamp' guard from its included hook"
status: done
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7151
claim: "2026-08-28T11:34:53Z"
assignee: "honor-class-body-precedence-in-extend"
blocked-by: null
closed-reason: null
---

## Context

Found while issuing ActiveRecord's `attribute_method_*` patterns from
`included` hooks (PR #7122).

`ActiveRecord::AttributeMethods::Dirty`'s `included do` block opens with a
guard that PR #7122 did not port:

`activerecord/lib/active_record/attribute_methods/dirty.rb:44-47`

```ruby
included do
  if self < ::ActiveRecord::Timestamp
    raise "You cannot include Dirty after Timestamp"
  end
  ...
```

Rails' `Module#<` asks whether the including class already has
`ActiveRecord::Timestamp` in its ancestry. Timestamp prepends `_create_record` /
`_update_record` wrappers that must sit ABOVE Dirty's `changesApplied()` links,
so including Dirty second silently breaks dirty tracking on save — the raise is
what turns that into a loud failure.

trails' `packages/activerecord/src/attribute-methods/dirty.ts`'s
`static [included](base)` (added by #7122) issues the two `class_attribute`s and
the five affix/prefix/suffix macros, but not this guard. The comment in PR
#7122's body records it as unported: "there is no module-ancestry predicate to
test it with".

Note the ordering in `base.ts` is currently correct — `include(Base, _Dirty)`
runs well before `include(Base, Timestamp.InstanceMethods)` — so this is a
missing safety net, not a live bug. It only bites whoever reorders the wiring
block.

## Converged shape

Give `include()` / `extend()` in `packages/activesupport/src/include.ts` a
Ruby `Module#<` analogue — the ancestry question the guard asks — and call it
from `Dirty`'s `[included]` hook, raising the same message string:
`"You cannot include Dirty after Timestamp"`.

`include()` already keeps a per-prototype registry of the keys each mixin
installed (the `includedKeys` symbol, include.ts:120-152); the cheapest
faithful shape is to record the module objects a prototype has been given
alongside it, so `isModuleIncluded(base, Timestamp.InstanceMethods)` can answer
without a new abstraction layer. Whatever the mechanism, the raise must be at
`dirty.ts`'s hook, at the Rails line's position — first statement in the block,
ahead of the `class_attribute` calls.

## Acceptance criteria

- `ActiveRecord::AttributeMethods::Dirty`'s `[included]` hook raises
  `"You cannot include Dirty after Timestamp"` when the host already carries
  `ActiveRecord::Timestamp`, at dirty.rb:44-47's position and message.
- The ancestry predicate lives in `activesupport`'s `include.ts` next to
  `include()`, not as a bespoke helper in `activerecord`.
- A trails test proves the raise fires for a class that includes Timestamp
  first, and that `Base` itself (correct order) does not raise.
- `pnpm parity:api:calls` / `:args` clean; `pnpm parity:api:extra:gate` marks
  narrow, never rise.
