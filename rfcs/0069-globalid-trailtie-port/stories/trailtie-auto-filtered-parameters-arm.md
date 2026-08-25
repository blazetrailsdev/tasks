---
title: "Port the railtie AutoFilteredParameters arm into trailtie.ts"
status: ready
updated: 2026-07-27
rfc: "0069-globalid-trailtie-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

While porting the `extend_queries` arm of `active_record_encryption.configuration`
in #5320, the two sibling arms of the same Rails initializer were confirmed
still unported.

`vendor/rails/activerecord/lib/active_record/railtie.rb:345-346`:

```ruby
auto_filtered_parameters = ActiveRecord::Encryption::AutoFilteredParameters.new(app)
auto_filtered_parameters.enable if ActiveRecord::Encryption.config.add_to_filter_parameters
```

trails already has the class — `packages/activerecord/src/encryption/auto-filtered-parameters.ts`,
whose `enable()` at `:83` even checks `Configurable.config.addToFilterParameters`
— but nothing constructs or calls it. `packages/activerecord/src/trailtie.ts`'s
`active_record_encryption.configuration` initializer only forwards
`config.activeRecord.encryption` to `Configurable.configure` plus (as of #5320)
the extend-queries install; its own comment names this arm as deferred because
`AutoFilteredParameters.new(app)` needs the Application instance, which
`Railtie.initializer` does not supply.

So the work is partly the arm and partly deciding how an initializer body gets
at the app object.

## Acceptance criteria

- `Railtie.initializer` callbacks can reach the Application instance (or an
  agreed trails stand-in), enough to construct `AutoFilteredParameters`.
- The `railtie.rb:345-346` arm runs inside the `active_record_encryption`
  load-hook block, gated on `addToFilterParameters`, matching Rails ordering
  relative to `Encryption.configure`.
- The deferral note in `trailtie.ts`'s initializer comment is updated to drop
  this arm.
- A `RailtieTest` case covers enable-when-set and no-op-when-unset, and fails
  on the pre-change trailtie.
