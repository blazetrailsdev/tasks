---
title: "active_record_encryption.configuration runs its arms inline; Rails wraps them in on_load(:active_record_encryption)"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: "missing-arm"
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/encryption.rb:57` ends the module
with

```ruby
ActiveSupport.run_load_hooks :active_record_encryption, Encryption
```

and `railtie.rb:337-347` wraps the whole `active_record_encryption.configuration`
initializer body in `ActiveSupport.on_load(:active_record_encryption)`.

trails fires no `active_record_encryption` load hook at all
(`git grep active_record_encryption packages/activerecord/src` finds only the
initializer name and credential strings), so
`packages/activerecord/src/trailtie.ts`'s
`active_record_encryption.configuration` initializer runs its arms —
`Configurable.configure` and, as of PR #7301, the
`AutoFilteredParameters.new(app)` / `enable` pair (`railtie.rb:345-346`) —
directly in the initializer body rather than inside the hook block.

Converging needs the hook to be fired with something: Rails passes the
`ActiveRecord::Encryption` module, and trails' `encryption.ts` is a module of
free exports with no module object to hand an `on_load` block. That is the
substance of the story.

## Acceptance criteria

- [ ] `packages/activerecord/src/encryption.ts` runs an
      `active_record_encryption` load hook at the bottom of its body, mirroring
      `encryption.rb:57`, with whatever stands in for the Ruby module.
- [ ] `trailtie.ts`'s `active_record_encryption.configuration` initializer body
      moves inside `onLoad("active_record_encryption", ...)`, matching
      `railtie.rb:337-347`; the `on_load(:active_record)` arm at `:349-355`
      stays where it is.
- [ ] `RailtieTest` still covers configure, extend-queries and the auto-filtered
      -parameters arms, with names unchanged.
